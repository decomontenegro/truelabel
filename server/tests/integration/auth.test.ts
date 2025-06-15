import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  afterAll(async () => {
    // Limpar após testes
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        role: 'BRAND'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'Test123!',
        name: 'Existing User',
        role: 'BRAND'
      };

      // Criar usuário primeiro
      await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      // Tentar criar novamente
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email já está em uso');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // muito curta
        name: 'A' // muito curto
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Criar usuário para testes de login
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      await prisma.user.create({
        data: {
          email: 'login-test@example.com',
          password: hashedPassword,
          name: 'Login Test',
          role: 'BRAND'
        }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'Test123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login-test@example.com');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken: string;

    beforeAll(async () => {
      // Fazer login para obter token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'Test123!'
        });
      
      authToken = response.body.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});