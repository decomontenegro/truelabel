import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// API rate limiter with different limits based on user role
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request, res: Response) => {
    // Check user role from JWT
    const user = (req as any).user;
    if (!user) return 50; // Unauthenticated users
    
    switch (user.role) {
      case 'ADMIN':
        return 1000;
      case 'BRAND':
      case 'LABORATORY':
        return 500;
      case 'PRESCRIBER':
        return 200;
      default:
        return 100;
    }
  },
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// QR scan rate limiter
export const qrScanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 scans per minute
  message: 'Too many QR code scans, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});