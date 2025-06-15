"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.uploadLimiter = exports.authLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rateLimiter = (maxRequests, windowMinutes) => {
    return (0, express_rate_limit_1.default)({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            error: 'Muitas tentativas. Tente novamente mais tarde.',
            retryAfter: windowMinutes
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            return `${req.ip}-${userId}`;
        }
    });
};
exports.rateLimiter = rateLimiter;
exports.authLimiter = (0, exports.rateLimiter)(5, 15);
exports.uploadLimiter = (0, exports.rateLimiter)(10, 60);
exports.apiLimiter = (0, exports.rateLimiter)(100, 15);
//# sourceMappingURL=rateLimiter.js.map