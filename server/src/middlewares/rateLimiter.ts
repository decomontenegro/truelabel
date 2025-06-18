import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../lib/redis';

interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
  keyPrefix?: string;
}

// Different rate limit configurations for different endpoints
const rateLimitConfigs = {
  // Strict limit for auth endpoints
  auth: {
    points: 5,
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 minutes
    keyPrefix: 'auth'
  },
  // Moderate limit for API endpoints
  api: {
    points: 100,
    duration: 60, // Per minute
    blockDuration: 60,
    keyPrefix: 'api'
  },
  // Relaxed limit for public endpoints
  public: {
    points: 500,
    duration: 60,
    blockDuration: 60,
    keyPrefix: 'public'
  },
  // Very strict for password reset
  passwordReset: {
    points: 3,
    duration: 3600, // 1 hour
    blockDuration: 3600,
    keyPrefix: 'pwd_reset'
  },
  // File upload limits
  upload: {
    points: 10,
    duration: 3600, // 1 hour
    blockDuration: 3600,
    keyPrefix: 'upload'
  }
};

// Create rate limiters
const createRateLimiter = (config: RateLimitConfig) => {
  try {
    // Use Redis if available
    if (redis) {
      return new RateLimiterRedis({
        storeClient: redis,
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        keyPrefix: config.keyPrefix,
        execEvenly: true // Spread requests evenly
      });
    }
  } catch (error) {
    console.warn('Redis not available for rate limiting, using memory store');
  }

  // Fallback to memory store
  return new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
    keyPrefix: config.keyPrefix,
    execEvenly: true
  });
};

// Initialize rate limiters
const rateLimiters = {
  auth: createRateLimiter(rateLimitConfigs.auth),
  api: createRateLimiter(rateLimitConfigs.api),
  public: createRateLimiter(rateLimitConfigs.public),
  passwordReset: createRateLimiter(rateLimitConfigs.passwordReset),
  upload: createRateLimiter(rateLimitConfigs.upload)
};

// Middleware factory
export const createRateLimitMiddleware = (type: keyof typeof rateLimiters) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limiter = rateLimiters[type];
      const key = getKey(req);
      
      // Consume 1 point
      const rateLimiterRes = await limiter.consume(key);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitConfigs[type].points.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      
      next();
    } catch (rejRes) {
      // Add rate limit headers even when blocked
      res.setHeader('X-RateLimit-Limit', rateLimitConfigs[type].points.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
      res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000).toString());
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.round(rejRes.msBeforeNext / 1000)} seconds.`,
        retryAfter: rejRes.msBeforeNext
      });
    }
  };
};

// Get key for rate limiting (IP + user ID if authenticated)
const getKey = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.id;
  
  return userId ? `${ip}_${userId}` : ip;
};

// Advanced rate limiting with custom rules
export const advancedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = getKey(req);
    const path = req.path;
    const method = req.method;
    
    // Custom rules based on path and method
    let limiter;
    let config;
    
    if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
      limiter = rateLimiters.auth;
      config = rateLimitConfigs.auth;
    } else if (path.startsWith('/api/auth/reset-password')) {
      limiter = rateLimiters.passwordReset;
      config = rateLimitConfigs.passwordReset;
    } else if (path.startsWith('/api/upload')) {
      limiter = rateLimiters.upload;
      config = rateLimitConfigs.upload;
    } else if (path.startsWith('/api/public')) {
      limiter = rateLimiters.public;
      config = rateLimitConfigs.public;
    } else {
      limiter = rateLimiters.api;
      config = rateLimitConfigs.api;
    }
    
    // Consume points based on method
    const points = method === 'GET' ? 1 : 2; // POST/PUT/DELETE cost more
    
    const rateLimiterRes = await limiter.consume(key, points);
    
    // Add headers
    res.setHeader('X-RateLimit-Limit', config.points.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
    
    next();
  } catch (rejRes) {
    const config = rateLimitConfigs.api; // Default config
    
    res.setHeader('X-RateLimit-Limit', config.points.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
    res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000).toString());
    
    // Log potential abuse
    console.warn(`Rate limit exceeded for ${getKey(req)} on ${req.path}`);
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.round(rejRes.msBeforeNext / 1000)} seconds.`,
      retryAfter: rejRes.msBeforeNext
    });
  }
};

// Rate limit by user role (for authenticated routes)
export const roleBasedRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;
  
  if (!user) {
    return next();
  }
  
  // Different limits based on user role
  const roleLimits = {
    ADMIN: { points: 1000, duration: 60 },
    BRAND: { points: 500, duration: 60 },
    LABORATORY: { points: 500, duration: 60 },
    PRESCRIBER: { points: 200, duration: 60 },
    CONSUMER: { points: 100, duration: 60 }
  };
  
  const limit = roleLimits[user.role] || roleLimits.CONSUMER;
  
  try {
    const limiter = new RateLimiterMemory(limit);
    await limiter.consume(user.id);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for your account type.'
    });
  }
};

// Middleware exports
export const rateLimitAuth = createRateLimitMiddleware('auth');
export const rateLimitAPI = createRateLimitMiddleware('api');
export const rateLimitPublic = createRateLimitMiddleware('public');
export const rateLimitPasswordReset = createRateLimitMiddleware('passwordReset');
export const rateLimitUpload = createRateLimitMiddleware('upload');