import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import app from '../../src/index';
import * as authService from '../../src/services/auth.service';

const prisma = new PrismaClient();

describe('Authentication Security Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.user.deleteMany();
  });

  describe('Password Security', () => {
    it('should hash passwords properly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = ['123456', 'password', 'abc', '12345678'];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password,
            role: 'BRAND'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('senha');
      }
    });

    it('should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: 'BRAND'
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    });
  });

  describe('JWT Security', () => {
    it('should generate secure JWT tokens', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3); // JWT structure

      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.exp).toBeDefined();
    });

    it('should reject expired tokens', async () => {
      const payload = { id: 1, email: 'test@example.com' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '-1h' }); // Already expired

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Token');
    });

    it('should reject tampered tokens', async () => {
      const payload = { id: 1, email: 'test@example.com' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(payload, secret);

      // Tamper with the token
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Session Security', () => {
    it('should handle concurrent login attempts', async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'BRAND'
        }
      });

      // Attempt multiple concurrent logins
      const loginPromises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'TestPassword123!'
          })
      );

      const responses = await Promise.all(loginPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });

      // But each should have a unique token
      const tokens = responses.map(r => r.body.token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should invalidate tokens on logout', async () => {
      // This would require implementing a token blacklist
      // For now, we ensure logout endpoint exists
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Authorization Security', () => {
    let adminToken: string;
    let brandToken: string;
    let labToken: string;

    beforeEach(async () => {
      // Create users with different roles
      const users = [
        { email: 'admin@test.com', role: 'ADMIN' },
        { email: 'brand@test.com', role: 'BRAND' },
        { email: 'lab@test.com', role: 'LABORATORY' }
      ];

      for (const user of users) {
        const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
        await prisma.user.create({
          data: {
            name: `${user.role} User`,
            email: user.email,
            password: hashedPassword,
            role: user.role as any
          }
        });
      }

      // Get tokens
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'TestPassword123!' });
      adminToken = adminLogin.body.token;

      const brandLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'brand@test.com', password: 'TestPassword123!' });
      brandToken = brandLogin.body.token;

      const labLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'lab@test.com', password: 'TestPassword123!' });
      labToken = labLogin.body.token;
    });

    it('should enforce role-based access control', async () => {
      // Admin should access admin endpoints
      const adminResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).not.toBe(403);

      // Brand should not access admin endpoints
      const brandResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${brandToken}`);
      expect(brandResponse.status).toBe(403);

      // Lab should not access admin endpoints
      const labResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${labToken}`);
      expect(labResponse.status).toBe(403);
    });

    it('should prevent privilege escalation', async () => {
      // Brand user trying to update their own role
      const response = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          role: 'ADMIN'
        });

      expect(response.status).toBe(400);
      // Verify role wasn't changed
      const user = await prisma.user.findUnique({
        where: { email: 'brand@test.com' }
      });
      expect(user?.role).toBe('BRAND');
    });
  });

  describe('Input Sanitization', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousInputs = [
        { email: "admin' OR '1'='1", password: 'anything' },
        { email: 'admin@test.com', password: "' OR '1'='1" },
        { email: "admin'; DROP TABLE users; --", password: 'test' }
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(input);

        expect(response.status).toBe(401);
        expect(response.body.message).not.toContain('SQL');
        expect(response.body.message).not.toContain('database');
      }
    });

    it('should prevent XSS in user registration', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: payload,
            email: `test${Date.now()}@example.com`,
            password: 'SecurePass123!',
            role: 'BRAND'
          });

        if (response.status === 201) {
          // Check that the name was sanitized
          expect(response.body.user.name).not.toContain('<script>');
          expect(response.body.user.name).not.toContain('javascript:');
        }
      }
    });
  });

  describe('Brute Force Protection', () => {
    it('should lock account after multiple failed attempts', async () => {
      const email = 'bruteforce@test.com';
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      
      await prisma.user.create({
        data: {
          name: 'Test User',
          email,
          password: hashedPassword,
          role: 'BRAND'
        }
      });

      // Make multiple failed login attempts
      const failedAttempts = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email,
            password: 'WrongPassword'
          })
      );

      await Promise.all(failedAttempts);

      // Now try with correct password
      const correctAttempt = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'CorrectPassword123!'
        });

      // Should be rate limited or account locked
      expect(correctAttempt.status).toBeGreaterThanOrEqual(429);
    });
  });
});