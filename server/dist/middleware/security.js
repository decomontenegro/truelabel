"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadSecurity = exports.sessionSecurity = exports.ipWhitelist = exports.requestId = exports.validateContentType = exports.corsOptions = exports.validateApiKey = exports.sanitizeRequest = exports.speedLimiter = exports.apiRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const crypto_1 = require("crypto");
const logger_1 = require("../utils/logger");
const prisma_1 = require("../lib/prisma");
exports.securityHeaders = (0, helmet_1.default)({
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
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded', {
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
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.',
    handler: async (req, res) => {
        await logSecurityEvent('RATE_LIMIT_AUTH', req);
        res.status(429).json({
            error: 'Too many authentication attempts',
            retryAfter: req.rateLimit?.resetTime
        });
    }
});
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
    skip: (req) => {
        return req.user?.role === 'ADMIN';
    }
});
exports.speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 100,
    maxDelayMs: 2000
});
const sanitizeRequest = (req, res, next) => {
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
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return !dangerousPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).every(checkValue);
        }
        return true;
    };
    if (!checkValue(req.body) || !checkValue(req.query) || !checkValue(req.params)) {
        logger_1.logger.warn('Potentially malicious request blocked', {
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
exports.sanitizeRequest = sanitizeRequest;
const validateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    const hashedKey = (0, crypto_1.createHash)('sha256').update(apiKey).digest('hex');
    try {
        const key = await prisma_1.prisma.apiKey.findFirst({
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
        await prisma_1.prisma.apiKey.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() }
        });
        req.user = key.user;
        next();
    }
    catch (error) {
        logger_1.logger.error('API key validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.validateApiKey = validateApiKey;
exports.corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://truelabel.com.br',
            'https://www.truelabel.com.br',
            'https://api.truelabel.com.br'
        ].filter(Boolean);
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn('CORS blocked request', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400
};
async function logSecurityEvent(event, req, details) {
    try {
        await prisma_1.prisma.securityLog.create({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to log security event:', error);
    }
}
const validateContentType = (allowedTypes) => {
    return (req, res, next) => {
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
exports.validateContentType = validateContentType;
const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
};
exports.requestId = requestId;
const ipWhitelist = (whitelist) => {
    return (req, res, next) => {
        const clientIp = req.ip || req.connection.remoteAddress || '';
        if (!whitelist.includes(clientIp)) {
            logger_1.logger.warn('Access denied for IP', { ip: clientIp });
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
const sessionSecurity = (req, res, next) => {
    if (req.session) {
        req.session.cookie.secure = process.env.NODE_ENV === 'production';
        req.session.cookie.httpOnly = true;
        req.session.cookie.sameSite = 'strict';
    }
    next();
};
exports.sessionSecurity = sessionSecurity;
exports.fileUploadSecurity = {
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return callback(null, true);
        }
        else {
            logger_1.logger.warn('File upload rejected', {
                filename: file.originalname,
                mimetype: file.mimetype
            });
            callback(new Error('Invalid file type'));
        }
    }
};
exports.default = {
    securityHeaders: exports.securityHeaders,
    generalRateLimit: exports.generalRateLimit,
    authRateLimit: exports.authRateLimit,
    apiRateLimit: exports.apiRateLimit,
    speedLimiter: exports.speedLimiter,
    sanitizeRequest: exports.sanitizeRequest,
    validateApiKey: exports.validateApiKey,
    corsOptions: exports.corsOptions,
    validateContentType: exports.validateContentType,
    requestId: exports.requestId,
    ipWhitelist: exports.ipWhitelist,
    sessionSecurity: exports.sessionSecurity,
    fileUploadSecurity: exports.fileUploadSecurity
};
//# sourceMappingURL=security.js.map