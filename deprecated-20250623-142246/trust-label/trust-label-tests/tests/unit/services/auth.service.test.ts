import { AuthService } from '@/services/auth.service';
import { prisma } from '../../setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  InvalidCredentialsError,
  UnauthorizedError,
  DuplicateResourceError,
  ValidationError,
  TokenExpiredError
} from '@/errors/app-errors';
import { faker } from '@faker-js/faker';
import { config } from '@/config/env.config';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    const validRegistrationData = {
      email: faker.internet.email(),
      password: 'StrongP@ssw0rd123',
      name: faker.person.fullName(),
      company: faker.company.name(),
      role: 'brand' as const,
    };

    it('should register a new user successfully', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await authService.register(validRegistrationData);

      // Assert
      expect(result).toMatchObject({
        user: expect.objectContaining({
          email: validRegistrationData.email,
          name: validRegistrationData.name,
          role: validRegistrationData.role,
        }),
        token: 'mock-jwt-token',
        refreshToken: expect.any(String),
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        validRegistrationData.password,
        expect.any(Number)
      );
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      await prisma.user.create({
        data: {
          email: validRegistrationData.email,
          password: 'hashed',
          name: 'Existing User',
          role: 'brand',
        },
      });

      // Act & Assert
      await expect(authService.register(validRegistrationData))
        .rejects
        .toThrow(DuplicateResourceError);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak',
      };

      // Act & Assert
      await expect(authService.register(weakPasswordData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should create associated brand for brand role', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      // Act
      await authService.register({
        ...validRegistrationData,
        role: 'brand',
      });

      // Assert
      const brand = await prisma.brand.findFirst({
        where: { email: validRegistrationData.email },
      });
      expect(brand).toBeDefined();
      expect(brand?.name).toBe(validRegistrationData.company);
    });

    it('should create associated laboratory for laboratory role', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const labData = {
        ...validRegistrationData,
        role: 'laboratory' as const,
        accreditation: 'ISO17025',
      };

      // Act
      await authService.register(labData);

      // Assert
      const laboratory = await prisma.laboratory.findFirst({
        where: { email: labData.email },
      });
      expect(laboratory).toBeDefined();
      expect(laboratory?.accreditation).toBe('ISO17025');
    });

    it('should send welcome email after registration', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('mock-jwt-token');
      const sendEmailSpy = jest.spyOn(authService as any, 'sendWelcomeEmail');

      // Act
      await authService.register(validRegistrationData);

      // Assert
      expect(sendEmailSpy).toHaveBeenCalledWith(
        validRegistrationData.email,
        validRegistrationData.name
      );
    });
  });

  describe('login', () => {
    const mockUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: 'hashed-password',
      name: faker.person.fullName(),
      role: 'brand' as const,
      isActive: true,
      emailVerified: true,
    };

    beforeEach(async () => {
      await prisma.user.create({ data: mockUser });
    });

    it('should login user with valid credentials', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await authService.login({
        email: mockUser.email,
        password: 'correct-password',
      });

      // Assert
      expect(result).toMatchObject({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }),
        token: 'mock-jwt-token',
        refreshToken: expect.any(String),
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'correct-password',
        mockUser.password
      );
    });

    it('should throw error for invalid email', async () => {
      // Act & Assert
      await expect(authService.login({
        email: 'nonexistent@email.com',
        password: 'password',
      }))
        .rejects
        .toThrow(InvalidCredentialsError);
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login({
        email: mockUser.email,
        password: 'wrong-password',
      }))
        .rejects
        .toThrow(InvalidCredentialsError);
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: mockUser.id },
        data: { isActive: false },
      });

      // Act & Assert
      await expect(authService.login({
        email: mockUser.email,
        password: 'password',
      }))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should update last login timestamp', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      // Act
      await authService.login({
        email: mockUser.email,
        password: 'correct-password',
      });

      // Assert
      const updatedUser = await prisma.user.findUnique({
        where: { id: mockUser.id },
      });
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(updatedUser?.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Arrange
      const payload = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        role: 'brand',
      };
      mockJwt.verify.mockReturnValue(payload);

      const user = await prisma.user.create({
        data: {
          id: payload.id,
          email: payload.email,
          password: 'hashed',
          name: 'Test User',
          role: payload.role as any,
          isActive: true,
        },
      });

      // Act
      const result = await authService.verifyToken('valid-token');

      // Assert
      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', config.JWT_SECRET);
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken('invalid-token'))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw error for expired token', async () => {
      // Arrange
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken('expired-token'))
        .rejects
        .toThrow(TokenExpiredError);
    });

    it('should throw error for user not found', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({
        id: faker.string.uuid(),
        email: 'nonexistent@email.com',
      });

      // Act & Assert
      await expect(authService.verifyToken('valid-token-invalid-user'))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'hashed',
          name: 'Test User',
          role: 'brand',
        },
      });

      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'valid-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      mockJwt.sign.mockReturnValue('new-jwt-token');

      // Act
      const result = await authService.refreshToken(refreshToken.token);

      // Assert
      expect(result).toMatchObject({
        token: 'new-jwt-token',
        refreshToken: expect.any(String),
      });
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(authService.refreshToken('invalid-refresh-token'))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw error for expired refresh token', async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'hashed',
          name: 'Test User',
          role: 'brand',
        },
      });

      await prisma.refreshToken.create({
        data: {
          token: 'expired-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Act & Assert
      await expect(authService.refreshToken('expired-refresh-token'))
        .rejects
        .toThrow(TokenExpiredError);
    });
  });

  describe('changePassword', () => {
    let user: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'old-hashed-password',
          name: 'Test User',
          role: 'brand',
        },
      });
    });

    it('should change password successfully', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password');

      // Act
      await authService.changePassword(user.id, {
        currentPassword: 'old-password',
        newPassword: 'NewStr0ngP@ssword',
      });

      // Assert
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.password).toBe('new-hashed-password');
    });

    it('should throw error for incorrect current password', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword(user.id, {
        currentPassword: 'wrong-password',
        newPassword: 'NewStr0ngP@ssword',
      }))
        .rejects
        .toThrow(InvalidCredentialsError);
    });

    it('should validate new password strength', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.changePassword(user.id, {
        currentPassword: 'old-password',
        newPassword: 'weak',
      }))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'hashed',
          name: 'Test User',
          role: 'brand',
        },
      });

      const refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'active-refresh-token',
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Act
      await authService.logout(refreshToken.token);

      // Assert
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken.token },
      });
      expect(deletedToken).toBeNull();
    });

    it('should not throw error for non-existent token', async () => {
      // Act & Assert - Should not throw
      await expect(authService.logout('non-existent-token'))
        .resolves
        .not.toThrow();
    });
  });

  describe('permissions', () => {
    it('should check user permissions correctly', async () => {
      // Arrange
      const adminUser = {
        id: faker.string.uuid(),
        role: 'admin',
      };

      const brandUser = {
        id: faker.string.uuid(),
        role: 'brand',
      };

      // Act & Assert
      expect(authService.hasPermission(adminUser, 'manage_all')).toBe(true);
      expect(authService.hasPermission(brandUser, 'manage_all')).toBe(false);
      expect(authService.hasPermission(brandUser, 'create_product')).toBe(true);
    });
  });
});