"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const laboratorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    accreditation: zod_1.z.string().min(1, 'Acreditação é obrigatória'),
    email: zod_1.z.string().email('Email inválido'),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true)
});
router.get('/', async (req, res, next) => {
    try {
        const { page = '1', limit = '10', search, active } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { accreditation: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (active !== undefined) {
            where.isActive = active === 'true';
        }
        const [laboratories, total] = await Promise.all([
            prisma.laboratory.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    accreditation: true,
                    email: true,
                    phone: true,
                    address: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: { reports: true }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.laboratory.count({ where })
        ]);
        res.json({
            laboratories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const laboratory = await prisma.laboratory.findUnique({
            where: { id },
            include: {
                reports: {
                    include: {
                        product: {
                            select: { name: true, brand: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: { reports: true }
                }
            }
        });
        if (!laboratory) {
            throw (0, errorHandler_1.createError)('Laboratório não encontrado', 404);
        }
        res.json({ laboratory });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const data = laboratorySchema.parse(req.body);
        const existingLab = await prisma.laboratory.findUnique({
            where: { email: data.email }
        });
        if (existingLab) {
            throw (0, errorHandler_1.createError)('Email já está em uso', 409);
        }
        const laboratory = await prisma.laboratory.create({
            data,
            select: {
                id: true,
                name: true,
                accreditation: true,
                email: true,
                phone: true,
                address: true,
                isActive: true,
                createdAt: true
            }
        });
        res.status(201).json({
            message: 'Laboratório criado com sucesso',
            laboratory
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = laboratorySchema.partial().parse(req.body);
        const existingLab = await prisma.laboratory.findUnique({
            where: { id }
        });
        if (!existingLab) {
            throw (0, errorHandler_1.createError)('Laboratório não encontrado', 404);
        }
        if (data.email && data.email !== existingLab.email) {
            const emailExists = await prisma.laboratory.findUnique({
                where: { email: data.email }
            });
            if (emailExists) {
                throw (0, errorHandler_1.createError)('Email já está em uso', 409);
            }
        }
        const laboratory = await prisma.laboratory.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                accreditation: true,
                email: true,
                phone: true,
                address: true,
                isActive: true,
                updatedAt: true
            }
        });
        res.json({
            message: 'Laboratório atualizado com sucesso',
            laboratory
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = zod_1.z.object({
            isActive: zod_1.z.boolean()
        }).parse(req.body);
        const laboratory = await prisma.laboratory.findUnique({
            where: { id }
        });
        if (!laboratory) {
            throw (0, errorHandler_1.createError)('Laboratório não encontrado', 404);
        }
        const updatedLab = await prisma.laboratory.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true
            }
        });
        res.json({
            message: `Laboratório ${isActive ? 'ativado' : 'desativado'} com sucesso`,
            laboratory: updatedLab
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/stats', async (req, res, next) => {
    try {
        const { id } = req.params;
        const laboratory = await prisma.laboratory.findUnique({
            where: { id },
            select: { name: true }
        });
        if (!laboratory) {
            throw (0, errorHandler_1.createError)('Laboratório não encontrado', 404);
        }
        const [totalReports, validatedReports, pendingReports] = await Promise.all([
            prisma.report.count({
                where: { laboratoryId: id }
            }),
            prisma.report.count({
                where: {
                    laboratoryId: id,
                    validations: {
                        some: { status: 'APPROVED' }
                    }
                }
            }),
            prisma.report.count({
                where: {
                    laboratoryId: id,
                    validations: {
                        some: { status: 'PENDING' }
                    }
                }
            })
        ]);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyReports = await prisma.report.groupBy({
            by: ['createdAt'],
            where: {
                laboratoryId: id,
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            _count: true
        });
        res.json({
            laboratory: {
                name: laboratory.name
            },
            stats: {
                totalReports,
                validatedReports,
                pendingReports,
                monthlyTrend: monthlyReports.map(item => ({
                    month: item.createdAt,
                    count: item._count
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=laboratories.js.map