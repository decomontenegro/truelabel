import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

// Security Headers Middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.truelabel.com.br', 'wss://api.truelabel.com.br'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false
});

// Rate Limiting Configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  handler: async (req, res) => {
    // Log security event
    await logSecurityEvent('RATE_LIMIT_AUTH', req);
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'ADMIN';
  }
});

// Slow Down Middleware
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs at full speed
  delayMs: 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 2000 // Maximum delay of 2 seconds
});

// Request Sanitization Middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common injection patterns
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /SELECT.*FROM/gi,
    /INSERT.*INTO/gi,
    /UPDATE.*SET/gi,
    /DELETE.*FROM/gi,
    /DROP.*TABLE/gi,
    /UNION.*SELECT/gi,
    /OR.*1\s*=\s*1/gi,
    /AND.*1\s*=\s*1/gi
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return !dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };
  
  if (!checkValue(req.body) || !checkValue(req.query) || !checkValue(req.params)) {
    logger.warn('Potentially malicious request blocked', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(400).json({
      error: 'Invalid request data'
    });
  }
  
  next();
};

// API Key Validation Middleware
export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Hash the API key for comparison
  const hashedKey = createHash('sha256').update(apiKey).digest('hex');
  
  try {
    // Check if API key exists and is valid
    const key = await prisma.apiKey.findFirst({
      where: {
        keyHash: hashedKey,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });
    
    if (!key) {
      await logSecurityEvent('INVALID_API_KEY', req);
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() }
    });
    
    // Attach user to request
    req.user = key.user;
    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// CORS Configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://truelabel.com.br',
      'https://www.truelabel.com.br',
      'https://api.truelabel.com.br'
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Security Event Logging
async function logSecurityEvent(event: string, req: Request, details?: any) {
  try {
    await prisma.securityLog.create({
      data: {
        event,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
}

// Content Type Validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          allowed: allowedTypes
        });
      }
    }
    next();
  };
};

// Request ID Middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// IP Whitelist Middleware
export const ipWhitelist = (whitelist: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.connection.remoteAddress || '';
    
    if (!whitelist.includes(clientIp)) {
      logger.warn('Access denied for IP', { ip: clientIp });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

// Session Security Middleware
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Set secure session cookies
  if (req.session) {
    req.session.cookie.secure = process.env.NODE_ENV === 'production';
    req.session.cookie.httpOnly = true;
    req.session.cookie.sameSite = 'strict';
  }
  next();
};

// File Upload Security
export const fileUploadSecurity = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files per request
  },
  fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return callback(null, true);
    } else {
      logger.warn('File upload rejected', {
        filename: file.originalname,
        mimetype: file.mimetype
      });
      callback(new Error('Invalid file type'));
    }
  }
};

// Export all middleware
export default {
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  speedLimiter,
  sanitizeRequest,
  validateApiKey,
  corsOptions,
  validateContentType,
  requestId,
  ipWhitelist,
  sessionSecurity,
  fileUploadSecurity
};