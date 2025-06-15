import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import { Request, Response } from 'express';

// Rate limiting configurations for different endpoints
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for whitelisted IPs (e.g., monitoring services)
      const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      const clientIp = req.ip || req.socket.remoteAddress || '';
      return whitelist.includes(clientIp);
    },
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests, please try again later.',
          retryAfter: res.getHeader('Retry-After'),
        },
      });
    },
  });
};

// Different rate limiters for different operations
export const rateLimiters = {
  // General API rate limit
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests, please try again later.'
  ),

  // Strict rate limit for auth endpoints
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests per window
    'Too many authentication attempts, please try again later.'
  ),

  // Rate limit for validation endpoints (expensive operations)
  validation: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    20, // 20 validations per hour
    'Validation limit reached, please try again later.'
  ),

  // Rate limit for file uploads
  upload: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 uploads per hour
    'Upload limit reached, please try again later.'
  ),

  // Rate limit for report generation
  reports: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    5, // 5 reports per hour
    'Report generation limit reached, please try again later.'
  ),
};

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// MongoDB injection prevention
export const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt from ${req.ip} on key ${key}`);
  },
});

// HTTP Parameter Pollution prevention
export const parameterPollutionPrevention = hpp({
  whitelist: ['sort', 'page', 'limit', 'filter'], // Allow these parameters to have arrays
});

// Response compression for better performance
export const responseCompression = compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress responses with no-transform cache-control
    const cacheControl = res.getHeader('Cache-Control');
    if (typeof cacheControl === 'string' && cacheControl.includes('no-transform')) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Custom security middleware for additional checks
export const customSecurityChecks = (req: Request, res: Response, next: Function): void => {
  // Check for suspicious patterns in request
  const suspiciousPatterns = [
    /(\.\.\/)/, // Directory traversal
    /(<script|<iframe|javascript:)/i, // XSS attempts
    /(union.*select|select.*from|insert.*into|delete.*from)/i, // SQL injection
    /(\$\{|\$\(|`)/,  // Template injection
  ];

  const checkString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`Suspicious pattern detected from ${req.ip}: ${pattern}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUSPICIOUS_REQUEST',
          message: 'Invalid request detected',
        },
      });
    }
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:9101')
      .split(',')
      .map(o => o.trim());

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: Function): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
      },
    });
    return;
  }

  // In production, validate against database
  // For now, check against environment variable
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
  
  if (!validApiKeys.includes(apiKey)) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
      },
    });
    return;
  }

  next();
};

// Request size limits
export const requestSizeLimits = {
  json: '10mb',
  urlencoded: '10mb',
  raw: '20mb',
};

// File upload restrictions
export const fileUploadRestrictions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.csv', '.xls', '.xlsx'],
};