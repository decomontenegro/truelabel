import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { validateSession } from './session';
import { hasPermission, canAccessResource } from './permissions';
import { UserRole, Permission } from '@trust-label/types';
import { prisma } from '@trust-label/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    companyId?: string;
    sessionId: string;
    permissions: Permission[];
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  
  try {
    const payload = verifyToken(token);
    req.user = {
      ...payload,
      permissions: [], // Will be loaded if needed
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }
    
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const hasAny = permissions.some(permission => 
      hasPermission(req.user!.role, permission)
    );
    
    if (!hasAny) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

export function requireAllPermissions(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const hasAll = permissions.every(permission => 
      hasPermission(req.user!.role, permission)
    );
    
    if (!hasAll) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

// Resource-based access control middleware
export function requireResourceAccess(resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const resourceId = req.params.id;
    if (!resourceId) {
      res.status(400).json({ error: 'Resource ID required' });
      return;
    }
    
    try {
      // Load resource metadata based on type
      let resource: any;
      
      switch (resourceType) {
        case 'product':
          resource = await prisma.product.findUnique({
            where: { id: resourceId },
            select: { id: true, companyId: true },
          });
          break;
          
        case 'validation':
          resource = await prisma.validation.findUnique({
            where: { id: resourceId },
            select: { id: true, product: { select: { companyId: true } } },
          });
          if (resource) {
            resource.companyId = resource.product.companyId;
          }
          break;
          
        case 'report':
          resource = await prisma.report.findUnique({
            where: { id: resourceId },
            select: { id: true, laboratoryId: true },
          });
          break;
          
        default:
          res.status(400).json({ error: 'Invalid resource type' });
          return;
      }
      
      if (!resource) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }
      
      const canAccess = canAccessResource({
        userId: req.user.userId,
        userRole: req.user.role,
        companyId: req.user.companyId,
        resource: {
          type: resourceType as any,
          id: resourceId,
          companyId: resource.companyId,
        },
      });
      
      if (!canAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to check resource access' });
    }
  };
}

// Session validation middleware
export async function validateSessionMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
  
  if (!sessionToken) {
    res.status(401).json({ error: 'Session token required' });
    return;
  }
  
  try {
    const { user } = await validateSession(sessionToken as string);
    
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      companyId: user.companyId || undefined,
      sessionId: sessionToken as string,
      permissions: [], // Load if needed
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
}

// Rate limiting middleware
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      next();
      return;
    }
    
    if (userAttempts.count >= options.max) {
      res.status(429).json({
        error: options.message || 'Too many requests',
        retryAfter: userAttempts.resetTime - now,
      });
      return;
    }
    
    userAttempts.count++;
    next();
  };
}

// CORS middleware
export function cors(options?: {
  origin?: string | string[] | boolean;
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    // Handle origin
    if (options?.origin === true) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof options?.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options?.origin) && origin) {
      if (options.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Handle credentials
    if (options?.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle methods
    const methods = options?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    
    // Handle headers
    const allowedHeaders = options?.allowedHeaders || [
      'Content-Type',
      'Authorization',
      'X-Session-Token',
    ];
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    
    // Handle exposed headers
    if (options?.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  };
}