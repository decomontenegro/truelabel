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
const redis_1 = require("../lib/redis");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const validationSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('ID do produto inválido'),
    reportId: zod_1.z.string().optional(),
    type: zod_1.z.enum(['MANUAL', 'LABORATORY']).default('MANUAL'),
    status: zod_1.z.enum(['APPROVED', 'REJECTED', 'PARTIAL']),
    claimsValidated: zod_1.z.record(zod_1.z.any()).optional(),
    summary: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { page = '1', limit = '10', status, productId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const where = {};
        if (status) {
            where.status = status;
        }
        if (productId) {
            where.productId = productId;
        }
        if (req.user.role === 'BRAND') {
            where.product = {
                userId: req.user.id
            };
        }
        const [validations, total] = await Promise.all([
            prisma.validation.findMany({
                where,
                skip,
                take,
                include: {
                    product: {
                        select: { name: true, brand: true, sku: true }
                    },
                    report: {
                        include: {
                            laboratory: {
                                select: { name: true, accreditation: true }
                            }
                        }
                    },
                    user: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.validation.count({ where })
        ]);
        res.json({
            validations,
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
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isBrand = req.user.role === 'BRAND';
        const validation = await redis_1.cache.getOrSet(redis_1.CacheKeys.validation(id), async () => {
            const where = { id };
            if (isBrand) {
                where.product = {
                    userId
                };
            }
            const validation = await prisma.validation.findFirst({
                where,
                include: {
                    product: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    },
                    report: {
                        include: {
                            laboratory: true
                        }
                    },
                    user: {
                        select: { name: true, email: true }
                    }
                }
            });
            if (!validation) {
                throw (0, errorHandler_1.createError)('Validação não encontrada', 404);
            }
            return validation;
        }, redis_1.CacheTTL.medium);
        res.json({ validation });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, async (req, res, next) => {
    try {
        const preprocessedBody = req.body;
        const data = validationSchema.parse(preprocessedBody);
        if (data.type === 'LABORATORY' && (!data.reportId || data.reportId === '')) {
            throw (0, errorHandler_1.createError)('Relatório é obrigatório para validação laboratorial', 400);
        }
        if (data.reportId && data.reportId !== '' && !zod_1.z.string().uuid().safeParse(data.reportId).success) {
            throw (0, errorHandler_1.createError)('ID do relatório deve ser um UUID válido', 400);
        }
        const product = await prisma.product.findUnique({
            where: { id: data.productId }
        });
        if (!product) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        if (req.user.role === 'BRAND' && product.userId !== req.user.id) {
            throw (0, errorHandler_1.createError)('Você só pode validar seus próprios produtos', 403);
        }
        if (data.type === 'LABORATORY' && data.reportId) {
            const report = await prisma.report.findUnique({
                where: { id: data.reportId }
            });
            if (!report) {
                throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
            }
        }
        const whereExisting = { productId: data.productId };
        if (data.reportId) {
            whereExisting.reportId = data.reportId;
        }
        const existingValidation = await prisma.validation.findFirst({
            where: whereExisting
        });
        if (existingValidation) {
            throw (0, errorHandler_1.createError)('Já existe uma validação para este produto', 409);
        }
        const validation = await prisma.validation.create({
            data: {
                productId: data.productId,
                reportId: data.reportId && data.reportId !== '' ? data.reportId : null,
                type: data.type,
                status: data.status,
                claimsValidated: JSON.stringify(data.claimsValidated || {}),
                summary: data.summary || null,
                notes: data.notes || null,
                userId: req.user.id,
                validatedAt: data.status === 'APPROVED' ? new Date() : null
            },
            include: {
                product: {
                    select: { name: true, brand: true, sku: true }
                },
                report: {
                    include: {
                        laboratory: {
                            select: { name: true, accreditation: true }
                        }
                    }
                },
                user: {
                    select: { name: true }
                }
            }
        });
        if (data.status === 'APPROVED') {
            await prisma.product.update({
                where: { id: data.productId },
                data: { status: 'VALIDATED' }
            });
        }
        else if (data.status === 'REJECTED') {
            await prisma.product.update({
                where: { id: data.productId },
                data: { status: 'REJECTED' }
            });
        }
        await redis_1.cache.invalidate(redis_1.CacheKeys.validation(validation.id));
        await redis_1.cache.invalidate(redis_1.CacheKeys.product(data.productId));
        await redis_1.cache.invalidate(redis_1.CacheKeys.validationQueue());
        if (data.status === 'PENDING') {
            await redis_1.cache.zadd(redis_1.CacheKeys.validationQueue(), Date.now(), validation.id);
        }
        res.status(201).json({
            message: 'Validação criada com sucesso',
            validation
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = validationSchema.partial().parse(req.body);
        const existingValidation = await prisma.validation.findUnique({
            where: { id }
        });
        if (!existingValidation) {
            throw (0, errorHandler_1.createError)('Validação não encontrada', 404);
        }
        const validation = await prisma.validation.update({
            where: { id },
            data: {
                ...data,
                validatedAt: data.status === 'APPROVED' ? new Date() : existingValidation.validatedAt
            },
            include: {
                product: {
                    select: { name: true, brand: true, sku: true }
                },
                report: {
                    include: {
                        laboratory: {
                            select: { name: true, accreditation: true }
                        }
                    }
                },
                user: {
                    select: { name: true }
                }
            }
        });
        if (data.status) {
            let productStatus = 'PENDING';
            if (data.status === 'APPROVED') {
                productStatus = 'VALIDATED';
            }
            else if (data.status === 'REJECTED') {
                productStatus = 'REJECTED';
            }
            await prisma.product.update({
                where: { id: existingValidation.productId },
                data: { status: productStatus }
            });
        }
        await redis_1.cache.invalidate(redis_1.CacheKeys.validation(id));
        await redis_1.cache.invalidate(redis_1.CacheKeys.product(existingValidation.productId));
        await redis_1.cache.invalidate(redis_1.CacheKeys.validationQueue());
        res.json({
            message: 'Validação atualizada com sucesso',
            validation
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats/overview', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const isBrand = req.user.role === 'BRAND';
        const cacheKey = redis_1.CacheKeys.analytics('validation-stats', isBrand ? userId : 'all');
        const stats = await redis_1.cache.getOrSet(cacheKey, async () => {
            const where = {};
            if (isBrand) {
                where.product = {
                    userId
                };
            }
            const [total, approved, rejected, partial, pending] = await Promise.all([
                prisma.validation.count({ where }),
                prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
                prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
                prisma.validation.count({ where: { ...where, status: 'PARTIAL' } }),
                prisma.validation.count({ where: { ...where, status: 'PENDING' } })
            ]);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const monthlyValidations = await prisma.validation.groupBy({
                by: ['createdAt'],
                where: {
                    ...where,
                    createdAt: {
                        gte: sixMonthsAgo
                    }
                },
                _count: true
            });
            return {
                overview: {
                    total,
                    approved,
                    rejected,
                    partial,
                    pending
                },
                monthlyTrend: monthlyValidations.map(item => ({
                    month: item.createdAt,
                    count: item._count
                }))
            };
        }, redis_1.CacheTTL.medium);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const where = {};
        if (req.user.role === 'BRAND') {
            where.product = {
                userId: req.user.id
            };
        }
        const [total, approved, rejected, partial] = await Promise.all([
            prisma.validation.count({ where }),
            prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
            prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
            prisma.validation.count({ where: { ...where, status: 'PARTIAL' } })
        ]);
        const byType = await prisma.validation.groupBy({
            by: ['type'],
            where,
            _count: true
        });
        const avgValidationTime = 48;
        res.json({
            metrics: {
                total,
                approved,
                rejected,
                partial,
                approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : 0,
                avgValidationTime,
                byType: byType.map(item => ({
                    type: item.type,
                    count: item._count
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/queue', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { page = '1', limit = '10', priority } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const queueIds = await redis_1.cache.zrange(redis_1.CacheKeys.validationQueue(), 0, -1, true);
        if (queueIds.length > 0) {
            const start = (pageNum - 1) * limitNum;
            const end = start + limitNum;
            const paginatedIds = queueIds.slice(start * 2, end * 2);
            const validationIds = [];
            for (let i = 0; i < paginatedIds.length; i += 2) {
                validationIds.push(paginatedIds[i]);
            }
            const validations = await prisma.validation.findMany({
                where: {
                    id: { in: validationIds },
                    status: 'PENDING'
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            brand: true,
                            sku: true,
                            createdAt: true
                        }
                    },
                    report: {
                        select: {
                            laboratory: {
                                select: { name: true }
                            }
                        }
                    }
                }
            });
            const queueWithEstimates = validations.map((item, index) => ({
                ...item,
                position: start + index + 1,
                estimatedTime: (start + index + 1) * 24,
                priority: 'NORMAL'
            }));
            res.json({
                queue: queueWithEstimates,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: queueIds.length / 2,
                    pages: Math.ceil(queueIds.length / 2 / limitNum)
                },
                summary: {
                    totalPending: queueIds.length / 2,
                    estimatedClearTime: (queueIds.length / 2) * 24
                }
            });
            return;
        }
        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;
        const where = {
            status: 'PENDING'
        };
        if (req.user.role === 'BRAND') {
            where.product = {
                userId: req.user.id
            };
        }
        if (priority) {
        }
        const [queue, total] = await Promise.all([
            prisma.validation.findMany({
                where,
                skip,
                take,
                include: {
                    product: {
                        select: {
                            name: true,
                            brand: true,
                            sku: true,
                            createdAt: true
                        }
                    },
                    report: {
                        select: {
                            laboratory: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.validation.count({ where })
        ]);
        for (const validation of queue) {
            await redis_1.cache.zadd(redis_1.CacheKeys.validationQueue(), new Date(validation.createdAt).getTime(), validation.id);
        }
        const queueWithEstimates = queue.map((item, index) => ({
            ...item,
            position: skip + index + 1,
            estimatedTime: (skip + index + 1) * 24,
            priority: 'NORMAL'
        }));
        res.json({
            queue: queueWithEstimates,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            summary: {
                totalPending: total,
                estimatedClearTime: total * 24
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=validations.js.map