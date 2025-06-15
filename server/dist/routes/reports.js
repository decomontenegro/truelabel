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
const upload_1 = require("../middleware/upload");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("../lib/redis");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const reportSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('ID do produto inválido'),
    laboratoryId: zod_1.z.string().uuid('ID do laboratório inválido'),
    analysisType: zod_1.z.string().min(1, 'Tipo de análise é obrigatório'),
    results: zod_1.z.any().optional()
});
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { page = '1', limit = '10', productId, laboratoryId } = req.query;
        const userId = req.user.id;
        const isBrand = req.user.role === 'BRAND';
        const useCache = productId && !laboratoryId;
        const cacheKey = useCache ? redis_1.CacheKeys.reportList(productId) : null;
        if (cacheKey) {
            const cached = await redis_1.cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const where = {};
        if (productId) {
            where.productId = productId;
        }
        if (laboratoryId) {
            where.laboratoryId = laboratoryId;
        }
        if (isBrand) {
            where.product = {
                userId
            };
        }
        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take,
                include: {
                    product: {
                        select: { name: true, brand: true, sku: true }
                    },
                    laboratory: {
                        select: { name: true, accreditation: true }
                    },
                    validations: {
                        select: { status: true, validatedAt: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.report.count({ where })
        ]);
        const response = {
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };
        if (cacheKey) {
            await redis_1.cache.set(cacheKey, response, redis_1.CacheTTL.short);
        }
        res.json(response);
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
        const report = await redis_1.cache.getOrSet(redis_1.CacheKeys.report(id), async () => {
            const where = { id };
            if (isBrand) {
                where.product = {
                    userId
                };
            }
            const report = await prisma.report.findFirst({
                where,
                include: {
                    product: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    },
                    laboratory: true,
                    validations: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            if (!report) {
                throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
            }
            return report;
        }, redis_1.CacheTTL.medium);
        res.json({ report });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireLabOrAdmin, upload_1.uploadReport, async (req, res, next) => {
    try {
        if (!req.file) {
            throw (0, errorHandler_1.createError)('Arquivo de relatório é obrigatório', 400);
        }
        const data = reportSchema.parse(req.body);
        const product = await prisma.product.findUnique({
            where: { id: data.productId }
        });
        if (!product) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        const laboratory = await prisma.laboratory.findUnique({
            where: { id: data.laboratoryId }
        });
        if (!laboratory) {
            throw (0, errorHandler_1.createError)('Laboratório não encontrado', 404);
        }
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        const verificationHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        const report = await prisma.report.create({
            data: {
                fileName: req.file.filename,
                originalName: req.file.originalname,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                analysisType: data.analysisType,
                results: data.results || {},
                verificationHash,
                productId: data.productId,
                laboratoryId: data.laboratoryId
            },
            include: {
                product: {
                    select: { name: true, brand: true, sku: true }
                },
                laboratory: {
                    select: { name: true, accreditation: true }
                }
            }
        });
        await redis_1.cache.invalidate(redis_1.CacheKeys.reportList(data.productId));
        await redis_1.cache.set(redis_1.CacheKeys.report(report.id), report, redis_1.CacheTTL.medium);
        res.status(201).json({
            message: 'Relatório enviado com sucesso',
            report
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/results', auth_1.authenticateToken, auth_1.requireLabOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { results } = req.body;
        const report = await prisma.report.findUnique({
            where: { id }
        });
        if (!report) {
            throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
        }
        const updatedReport = await prisma.report.update({
            where: { id },
            data: { results },
            include: {
                product: {
                    select: { name: true, brand: true }
                },
                laboratory: {
                    select: { name: true }
                }
            }
        });
        await redis_1.cache.invalidate(redis_1.CacheKeys.report(id));
        await redis_1.cache.invalidate(redis_1.CacheKeys.reportList(report.productId));
        res.json({
            message: 'Resultados atualizados com sucesso',
            report: updatedReport
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/verify', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = await prisma.report.findUnique({
            where: { id }
        });
        if (!report) {
            throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
        }
        if (!fs_1.default.existsSync(report.filePath)) {
            throw (0, errorHandler_1.createError)('Arquivo não encontrado no servidor', 404);
        }
        const fileBuffer = fs_1.default.readFileSync(report.filePath);
        const currentHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        const isValid = currentHash === report.verificationHash;
        await prisma.report.update({
            where: { id },
            data: { isVerified: isValid }
        });
        res.json({
            isValid,
            message: isValid ? 'Arquivo íntegro' : 'Arquivo foi modificado',
            originalHash: report.verificationHash,
            currentHash
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/download', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = { id };
        if (req.user.role === 'BRAND') {
            where.product = {
                userId: req.user.id
            };
        }
        const report = await prisma.report.findFirst({
            where
        });
        if (!report) {
            throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
        }
        if (!fs_1.default.existsSync(report.filePath)) {
            throw (0, errorHandler_1.createError)('Arquivo não encontrado no servidor', 404);
        }
        res.download(report.filePath, report.originalName);
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/parse', auth_1.authenticateToken, auth_1.requireLabOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const reportParserService = require('../services/reportParserService').default;
        const report = await prisma.report.findUnique({
            where: { id }
        });
        if (!report) {
            throw (0, errorHandler_1.createError)('Relatório não encontrado', 404);
        }
        const parsedData = await reportParserService.parseReport(id);
        res.json({
            message: 'Relatório analisado com sucesso',
            parsedData
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map