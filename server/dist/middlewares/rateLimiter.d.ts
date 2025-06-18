import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
declare const rateLimiters: {
    auth: RateLimiterRedis | RateLimiterMemory;
    api: RateLimiterRedis | RateLimiterMemory;
    public: RateLimiterRedis | RateLimiterMemory;
    passwordReset: RateLimiterRedis | RateLimiterMemory;
    upload: RateLimiterRedis | RateLimiterMemory;
};
export declare const createRateLimitMiddleware: (type: keyof typeof rateLimiters) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const advancedRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const roleBasedRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitAPI: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitPublic: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitPasswordReset: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitUpload: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map