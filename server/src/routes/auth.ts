import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['BRAND', 'LAB']).optional().default('BRAND')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário criado com sucesso
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Email já está em uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('Email já está em uso', 409);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Gerar token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Salvar sessão no cache
    await cache.set(
      CacheKeys.session(token),
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      CacheTTL.long // 24 horas
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError('Credenciais inválidas', 401);
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError('Credenciais inválidas', 401);
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Salvar sessão no cache
    await cache.set(
      CacheKeys.session(token),
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      CacheTTL.long // 24 horas
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Obter perfil do usuário
router.get('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional()
    });

    const data = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Verificar token
router.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Invalidar sessão no cache
      await cache.del(CacheKeys.session(token));
    }
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
