import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido'
      });
    }

    // Verificar sessão no cache primeiro
    const sessionKey = CacheKeys.session(token);
    const cachedUser = await cache.get<{ id: string; email: string; role: string }>(sessionKey);
    
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Verificar se o usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }

    // Salvar sessão no cache
    await cache.set(sessionKey, user, CacheTTL.medium);

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permissão insuficiente'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireBrandOrAdmin = requireRole(['BRAND', 'ADMIN']);
export const requireLabOrAdmin = requireRole(['LAB', 'ADMIN']);
