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
const qrCode_1 = require("../utils/qrCode");
const redis_1 = require("../lib/redis");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    brand: zod_1.z.string().min(2, 'Marca deve ter pelo menos 2 caracteres'),
    category: zod_1.z.string().min(2, 'Categoria é obrigatória'),
    description: zod_1.z.string().optional(),
    sku: zod_1.z.string().min(1, 'SKU é obrigatório'),
    batchNumber: zod_1.z.string().optional(),
    nutritionalInfo: zod_1.z.any().optional(),
    claims: zod_1.z.string().optional()
});
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { page = '1', limit = '10', search, category, status } = req.query;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';
        const cacheKey = isAdmin
            ? `products:all:${page}:${limit}:${search || ''}:${category || ''}:${status || ''}`
            : redis_1.CacheKeys.productList(userId, parseInt(page));
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const where = {};
        if (!isAdmin) {
            where.userId = userId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { brand: { contains: search } },
                { sku: { contains: search } }
            ];
        }
        if (category) {
            where.category = category;
        }
        if (status) {
            where.status = status;
        }
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    validations: {
                        select: { status: true, validatedAt: true }
                    },
                    _count: {
                        select: { reports: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);
        const response = {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };
        await redis_1.cache.set(cacheKey, response, redis_1.CacheTTL.short);
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
        const isAdmin = req.user.role === 'ADMIN';
        const product = await redis_1.cache.getOrSet(redis_1.CacheKeys.product(id), async () => {
            const where = { id };
            if (!isAdmin) {
                where.userId = userId;
            }
            const product = await prisma.product.findFirst({
                where,
                include: {
                    user: {
                        select: { name: true, email: true, role: true }
                    },
                    validations: {
                        include: {
                            report: {
                                select: {
                                    id: true,
                                    fileName: true,
                                    analysisType: true,
                                    results: true,
                                    laboratory: {
                                        select: { name: true, accreditation: true }
                                    }
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    reports: {
                        include: {
                            laboratory: {
                                select: { name: true, accreditation: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            if (!product) {
                throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
            }
            return product;
        }, redis_1.CacheTTL.medium);
        res.json({ product });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, upload_1.uploadProductImage, async (req, res, next) => {
    try {
        console.log('📝 Dados recebidos:', req.body);
        const data = productSchema.parse(req.body);
        console.log('✅ Dados após validação:', data);
        const claimsString = data.claims || '';
        console.log('🏷️ Claims processados:', claimsString);
        const existingSku = await prisma.product.findUnique({
            where: { sku: data.sku }
        });
        if (existingSku) {
            throw (0, errorHandler_1.createError)('SKU já existe', 409);
        }
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        const product = await prisma.product.create({
            data: {
                name: data.name,
                brand: data.brand,
                category: data.category,
                description: data.description || null,
                sku: data.sku,
                batchNumber: data.batchNumber || null,
                nutritionalInfo: typeof data.nutritionalInfo === 'string' ? data.nutritionalInfo : JSON.stringify(data.nutritionalInfo || {}),
                claims: claimsString,
                imageUrl,
                user: {
                    connect: { id: req.user.id }
                }
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        await redis_1.cache.invalidate(`products:${req.user.id}:*`);
        if (req.user.role === 'ADMIN') {
            await redis_1.cache.invalidate('products:all:*');
        }
        await redis_1.cache.set(redis_1.CacheKeys.product(product.id), product, redis_1.CacheTTL.medium);
        await redis_1.cache.set(redis_1.CacheKeys.productBySku(product.sku), product.id, redis_1.CacheTTL.long);
        res.status(201).json({
            message: 'Produto criado com sucesso',
            product
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, upload_1.uploadProductImage, async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = productSchema.partial().parse(req.body);
        const where = { id };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const existingProduct = await prisma.product.findFirst({ where });
        if (!existingProduct) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        let updateData = { ...data };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }
        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        await redis_1.cache.invalidate(redis_1.CacheKeys.product(id));
        await redis_1.cache.invalidate(`products:${req.user.id}:*`);
        if (req.user.role === 'ADMIN') {
            await redis_1.cache.invalidate('products:all:*');
        }
        if (data.sku && existingProduct.sku !== data.sku) {
            await redis_1.cache.invalidate(redis_1.CacheKeys.productBySku(existingProduct.sku));
            await redis_1.cache.set(redis_1.CacheKeys.productBySku(data.sku), id, redis_1.CacheTTL.long);
        }
        res.json({
            message: 'Produto atualizado com sucesso',
            product
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/qr-code', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = { id };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const product = await prisma.product.findFirst({ where });
        if (!product) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        const qrCode = await (0, qrCode_1.generateQRCode)(id);
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { qrCode }
        });
        res.json({
            message: 'QR Code gerado com sucesso',
            qrCode,
            validationUrl: `${process.env.QR_CODE_BASE_URL}/${qrCode}`
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/submit-for-validation', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = { id };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const product = await prisma.product.findFirst({ where });
        if (!product) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        if (product.status !== 'DRAFT') {
            throw (0, errorHandler_1.createError)('Produto já foi enviado para validação', 400);
        }
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { status: 'PENDING' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        res.json({
            message: 'Produto enviado para validação com sucesso',
            product: updatedProduct
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.authenticateToken, auth_1.requireBrandOrAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = { id };
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }
        const product = await prisma.product.findFirst({ where });
        if (!product) {
            throw (0, errorHandler_1.createError)('Produto não encontrado', 404);
        }
        await prisma.product.delete({ where: { id } });
        await redis_1.cache.invalidate(redis_1.CacheKeys.product(id));
        await redis_1.cache.invalidate(`products:${req.user.id}:*`);
        if (req.user.role === 'ADMIN') {
            await redis_1.cache.invalidate('products:all:*');
        }
        if (product.sku) {
            await redis_1.cache.invalidate(redis_1.CacheKeys.productBySku(product.sku));
        }
        res.json({
            message: 'Produto deletado com sucesso'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map