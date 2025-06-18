"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadRestrictions = exports.requestSizeLimits = exports.validateApiKey = exports.corsOptions = exports.customSecurityChecks = exports.responseCompression = exports.parameterPollutionPrevention = exports.mongoSanitizer = exports.securityHeaders = exports.rateLimiters = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const compression_1 = __importDefault(require("compression"));
const createRateLimiter = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: message || 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
            const clientIp = req.ip || req.socket.remoteAddress || '';
            return whitelist.includes(clientIp);
        },
        keyGenerator: (req) => {
            return req.user?.id || req.ip || 'anonymous';
        },
        handler: (req, res) => {
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
exports.createRateLimiter = createRateLimiter;
exports.rateLimiters = {
    general: (0, exports.createRateLimiter)(15 * 60 * 1000, 100, 'Too many requests, please try again later.'),
    auth: (0, exports.createRateLimiter)(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later.'),
    validation: (0, exports.createRateLimiter)(60 * 60 * 1000, 20, 'Validation limit reached, please try again later.'),
    upload: (0, exports.createRateLimiter)(60 * 60 * 1000, 10, 'Upload limit reached, please try again later.'),
    reports: (0, exports.createRateLimiter)(60 * 60 * 1000, 5, 'Report generation limit reached, please try again later.'),
};
exports.securityHeaders = (0, helmet_1.default)({
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
exports.mongoSanitizer = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential MongoDB injection attempt from ${req.ip} on key ${key}`);
    },
});
exports.parameterPollutionPrevention = (0, hpp_1.default)({
    whitelist: ['sort', 'page', 'limit', 'filter'],
});
exports.responseCompression = (0, compression_1.default)({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        const cacheControl = res.getHeader('Cache-Control');
        if (typeof cacheControl === 'string' && cacheControl.includes('no-transform')) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
});
const customSecurityChecks = (req, res, next) => {
    const suspiciousPatterns = [
        /(\.\.\/)/,
        /(<script|<iframe|javascript:)/i,
        /(union.*select|select.*from|insert.*into|delete.*from)/i,
        /(\$\{|\$\(|`)/,
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
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
};
exports.customSecurityChecks = customSecurityChecks;
exports.corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:9101')
            .split(',')
            .map(o => o.trim());
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
    optionsSuccessStatus: 200,
};
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
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
exports.validateApiKey = validateApiKey;
exports.requestSizeLimits = {
    json: '10mb',
    urlencoded: '10mb',
    raw: '20mb',
};
exports.fileUploadRestrictions = {
    maxFileSize: 10 * 1024 * 1024,
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
//# sourceMappingURL=security.middleware.js.map