import request from 'supertest';
import { app } from '@/server';
import { prisma } from '../setup';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '@/config/env.config';

describe('Auth API Integration Tests', () => {
  let server: any;

  beforeAll(() => {
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: faker.internet.email(),
      password: 'StrongP@ssw0rd123',
      name: faker.person.fullName(),
      company: faker.company.name(),
      role: 'brand',
    };

    it('should register new user successfully', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: validRegistrationData.email,
            name: validRegistrationData.name,
            role: validRegistrationData.role,
          },
          token: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: validRegistrationData.email },
      });
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      // Arrange
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
            }),
          ]),
        },
      });
    });

    it('should return 400 for weak password', async () => {
      // Arrange
      const weakPasswordData = {
        ...validRegistrationData,
        email: faker.internet.email(),
        password: 'weak',
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(weakPasswordData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'password',
        })
      );
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      await prisma.user.create({
        data: {
          email: validRegistrationData.email,
          password: await bcrypt.hash('password', 10),
          name: 'Existing User',
          role: 'brand',
        },
      });

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
        },
      });
    });

    it('should create associated brand for brand role', async () => {
      // Arrange
      const brandData = {
        ...validRegistrationData,
        email: faker.internet.email(),
        role: 'brand',
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(brandData);

      // Assert
      expect(response.status).toBe(201);
      
      const brand = await prisma.brand.findFirst({
        where: { email: brandData.email },
      });
      expect(brand).toBeDefined();
      expect(brand?.name).toBe(brandData.company);
    });

    it('should create associated laboratory for lab role', async () => {
      // Arrange
      const labData = {
        ...validRegistrationData,
        email: faker.internet.email(),
        role: 'laboratory',
        accreditation: 'ISO17025',
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(labData);

      // Assert
      expect(response.status).toBe(201);
      
      const laboratory = await prisma.laboratory.findFirst({
        where: { email: labData.email },
      });
      expect(laboratory).toBeDefined();
      expect(laboratory?.accreditation).toBe('ISO17025');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;
    const password = 'TestP@ssw0rd123';

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: await bcrypt.hash(password, 10),
          name: faker.person.fullName(),
          role: 'brand',
          isActive: true,
          emailVerified: true,
        },
      });
    });

    it('should login with valid credentials', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
          },
          token: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify JWT token
      const decoded = jwt.verify(response.body.data.token, config.JWT_SECRET) as any;
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should return 401 for invalid email', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@email.com',
          password: password,
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
        },
      });
    });

    it('should return 401 for invalid password', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
        },
      });
    });

    it('should return 401 for inactive user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('deactivated');
    });

    it('should update last login timestamp', async () => {
      // Act
      await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: password,
        });

      // Assert
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(new Date(updatedUser!.lastLogin!).getTime())
        .toBeGreaterThan(new Date(testUser.createdAt).getTime());
    });
  });

  describe('POST /api/auth/refresh', () => {
    let user: any;
    let refreshToken: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: await bcrypt.hash('password', 10),
          name: faker.person.fullName(),
          role: 'brand',
        },
      });

      refreshToken = await prisma.refreshToken.create({
        data: {
          token: faker.string.alphanumeric(64),
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    });

    it('should refresh token successfully', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken.token,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Old refresh token should be deleted
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken.token },
      });
      expect(oldToken).toBeNull();
    });

    it('should return 401 for invalid refresh token', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should return 401 for expired refresh token', async () => {
      // Arrange
      await prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: {
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken.token,
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
        },
      });
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let user: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: await bcrypt.hash('password', 10),
          name: faker.person.fullName(),
          role: 'brand',
        },
      });

      authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should access protected route with valid token', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    });

    it('should return 401 without token', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
        },
      });
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should return 401 with expired token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
        },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let user: any;
    let authToken: string;
    let refreshToken: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: await bcrypt.hash('password', 10),
          name: faker.person.fullName(),
          role: 'brand',
        },
      });

      authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      refreshToken = await prisma.refreshToken.create({
        data: {
          token: faker.string.alphanumeric(64),
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should logout successfully', async () => {
      // Act
      const response = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken: refreshToken.token,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });

      // Refresh token should be deleted
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken.token },
      });
      expect(deletedToken).toBeNull();
    });
  });
});