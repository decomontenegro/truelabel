"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireLabOrAdmin = exports.requireBrandOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const redis_1 = require("../lib/redis");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Token de acesso requerido'
            });
        }
        const sessionKey = redis_1.CacheKeys.session(token);
        const cachedUser = await redis_1.cache.get(sessionKey);
        if (cachedUser) {
            req.user = cachedUser;
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true }
        });
        if (!user) {
            return res.status(401).json({
                error: 'Usuário não encontrado'
            });
        }
        await redis_1.cache.set(sessionKey, user, redis_1.CacheTTL.medium);
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({
            error: 'Token inválido'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Permissão insuficiente'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
exports.requireBrandOrAdmin = (0, exports.requireRole)(['BRAND', 'ADMIN']);
exports.requireLabOrAdmin = (0, exports.requireRole)(['LAB', 'ADMIN']);
//# sourceMappingURL=auth.js.map