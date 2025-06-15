"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const redis_1 = require("../lib/redis");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    name: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    role: zod_1.z.enum(['BRAND', 'LAB']).optional().default('BRAND')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Senha é obrigatória')
});
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw (0, errorHandler_1.createError)('Email já está em uso', 409);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await redis_1.cache.set(redis_1.CacheKeys.session(token), {
            id: user.id,
            email: user.email,
            role: user.role
        }, redis_1.CacheTTL.long);
        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user,
            token
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw (0, errorHandler_1.createError)('Credenciais inválidas', 401);
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw (0, errorHandler_1.createError)('Credenciais inválidas', 401);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await redis_1.cache.set(redis_1.CacheKeys.session(token), {
            id: user.id,
            email: user.email,
            role: user.role
        }, redis_1.CacheTTL.long);
        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            throw (0, errorHandler_1.createError)('Usuário não encontrado', 404);
        }
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
});
router.put('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const updateSchema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            email: zod_1.z.string().email().optional()
        });
        const data = updateSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true
            }
        });
        res.json({
            message: 'Perfil atualizado com sucesso',
            user
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/verify', auth_1.authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});
router.post('/logout', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            await redis_1.cache.del(redis_1.CacheKeys.session(token));
        }
        res.json({
            message: 'Logout realizado com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map