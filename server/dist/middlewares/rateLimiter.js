"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitUpload = exports.rateLimitPasswordReset = exports.rateLimitPublic = exports.rateLimitAPI = exports.rateLimitAuth = exports.roleBasedRateLimit = exports.advancedRateLimit = exports.createRateLimitMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const redis_1 = require("../lib/redis");
const rateLimitConfigs = {
    auth: {
        points: 5,
        duration: 900,
        blockDuration: 900,
        keyPrefix: 'auth'
    },
    api: {
        points: 100,
        duration: 60,
        blockDuration: 60,
        keyPrefix: 'api'
    },
    public: {
        points: 500,
        duration: 60,
        blockDuration: 60,
        keyPrefix: 'public'
    },
    passwordReset: {
        points: 3,
        duration: 3600,
        blockDuration: 3600,
        keyPrefix: 'pwd_reset'
    },
    upload: {
        points: 10,
        duration: 3600,
        blockDuration: 3600,
        keyPrefix: 'upload'
    }
};
const createRateLimiter = (config) => {
    try {
        if (redis_1.redis) {
            return new rate_limiter_flexible_1.RateLimiterRedis({
                storeClient: redis_1.redis,
                points: config.points,
                duration: config.duration,
                blockDuration: config.blockDuration,
                keyPrefix: config.keyPrefix,
                execEvenly: true
            });
        }
    }
    catch (error) {
        console.warn('Redis not available for rate limiting, using memory store');
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: config.points,
        duration: config.duration,
        blockDuration: config.blockDuration,
        keyPrefix: config.keyPrefix,
        execEvenly: true
    });
};
const rateLimiters = {
    auth: createRateLimiter(rateLimitConfigs.auth),
    api: createRateLimiter(rateLimitConfigs.api),
    public: createRateLimiter(rateLimitConfigs.public),
    passwordReset: createRateLimiter(rateLimitConfigs.passwordReset),
    upload: createRateLimiter(rateLimitConfigs.upload)
};
const createRateLimitMiddleware = (type) => {
    return async (req, res, next) => {
        try {
            const limiter = rateLimiters[type];
            const key = getKey(req);
            const rateLimiterRes = await limiter.consume(key);
            res.setHeader('X-RateLimit-Limit', rateLimitConfigs[type].points.toString());
            res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
            res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
            next();
        }
        catch (rejRes) {
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
exports.createRateLimitMiddleware = createRateLimitMiddleware;
const getKey = (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = req.user?.id;
    return userId ? `${ip}_${userId}` : ip;
};
const advancedRateLimit = async (req, res, next) => {
    try {
        const key = getKey(req);
        const path = req.path;
        const method = req.method;
        let limiter;
        let config;
        if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
            limiter = rateLimiters.auth;
            config = rateLimitConfigs.auth;
        }
        else if (path.startsWith('/api/auth/reset-password')) {
            limiter = rateLimiters.passwordReset;
            config = rateLimitConfigs.passwordReset;
        }
        else if (path.startsWith('/api/upload')) {
            limiter = rateLimiters.upload;
            config = rateLimitConfigs.upload;
        }
        else if (path.startsWith('/api/public')) {
            limiter = rateLimiters.public;
            config = rateLimitConfigs.public;
        }
        else {
            limiter = rateLimiters.api;
            config = rateLimitConfigs.api;
        }
        const points = method === 'GET' ? 1 : 2;
        const rateLimiterRes = await limiter.consume(key, points);
        res.setHeader('X-RateLimit-Limit', config.points.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
        next();
    }
    catch (rejRes) {
        const config = rateLimitConfigs.api;
        res.setHeader('X-RateLimit-Limit', config.points.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
        res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000).toString());
        console.warn(`Rate limit exceeded for ${getKey(req)} on ${req.path}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.round(rejRes.msBeforeNext / 1000)} seconds.`,
            retryAfter: rejRes.msBeforeNext
        });
    }
};
exports.advancedRateLimit = advancedRateLimit;
const roleBasedRateLimit = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return next();
    }
    const roleLimits = {
        ADMIN: { points: 1000, duration: 60 },
        BRAND: { points: 500, duration: 60 },
        LABORATORY: { points: 500, duration: 60 },
        PRESCRIBER: { points: 200, duration: 60 },
        CONSUMER: { points: 100, duration: 60 }
    };
    const limit = roleLimits[user.role] || roleLimits.CONSUMER;
    try {
        const limiter = new rate_limiter_flexible_1.RateLimiterMemory(limit);
        await limiter.consume(user.id);
        next();
    }
    catch (rejRes) {
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded for your account type.'
        });
    }
};
exports.roleBasedRateLimit = roleBasedRateLimit;
exports.rateLimitAuth = (0, exports.createRateLimitMiddleware)('auth');
exports.rateLimitAPI = (0, exports.createRateLimitMiddleware)('api');
exports.rateLimitPublic = (0, exports.createRateLimitMiddleware)('public');
exports.rateLimitPasswordReset = (0, exports.createRateLimitMiddleware)('passwordReset');
exports.rateLimitUpload = (0, exports.createRateLimitMiddleware)('upload');
//# sourceMappingURL=rateLimiter.js.map