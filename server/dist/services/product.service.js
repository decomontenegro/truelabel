"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const client_1 = require("@prisma/client");
const prisma_optimizations_1 = require("../utils/database/prisma-optimizations");
const redis_1 = require("../lib/redis");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createModuleLogger)('ProductService');
const prisma = new client_1.PrismaClient();
class ProductService {
    static async getProducts(filters, pagination, userId, isAdmin = false) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (!isAdmin && userId) {
            where.userId = userId;
        }
        if (filters.brandId) {
            where.brandId = filters.brandId;
        }
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { ean: { contains: filters.search } },
                { brand: { name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const queryParams = prisma_optimizations_1.productQueries.findManyOptimized({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' }
        });
        const result = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getProducts', async () => {
            const [products, total] = await Promise.all([
                prisma.product.findMany(queryParams),
                prisma.product.count({ where })
            ]);
            return { products, total };
        });
        return {
            products: result.products,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit),
                hasMore: page * limit < result.total
            }
        };
    }
    static async getProductDetails(productId) {
        const cacheKey = redis_1.CacheKeys.productDetails ? redis_1.CacheKeys.productDetails(productId) : `product:${productId}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            log.debug('Product details loaded from cache', { productId });
            return cached;
        }
        const product = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getProductDetails', () => prisma.product.findUnique(prisma_optimizations_1.productQueries.findWithFullDetails(productId)));
        if (product) {
            await redis_1.cache.set(cacheKey, product, redis_1.CacheTTL.PRODUCT_DETAILS || 300);
        }
        return product;
    }
    static async getDashboardStats(brandId) {
        const cacheKey = brandId
            ? `stats:brand:${brandId}`
            : 'stats:all';
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const stats = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getDashboardStats', async () => {
            const [productStats, validationStats, totalProducts] = await Promise.all([
                prisma.product.groupBy({
                    by: ['status'],
                    where: brandId ? { brandId } : {},
                    _count: true
                }),
                prisma.validation.groupBy({
                    by: ['status'],
                    where: brandId ? { product: { brandId } } : {},
                    _count: true
                }),
                prisma.product.count({
                    where: brandId ? { brandId } : {}
                })
            ]);
            const productsByStatus = productStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {});
            const validationsByStatus = validationStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {});
            return {
                totalProducts,
                productsByStatus,
                validationsByStatus,
                activeProducts: productsByStatus['ACTIVE'] || 0,
                pendingValidations: validationsByStatus['PENDING'] || 0,
                completedValidations: validationsByStatus['VALIDATED'] || 0
            };
        });
        await redis_1.cache.set(cacheKey, stats, 300);
        return stats;
    }
    static async searchProducts(searchTerm, filters) {
        return prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('searchProducts', () => prisma.product.findMany(prisma_optimizations_2.searchQueries.searchProducts(searchTerm, filters)));
    }
    static async createProduct(data, userId) {
        return prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...data,
                    userId,
                    status: 'DRAFT'
                }
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_PRODUCT',
                    targetType: 'Product',
                    targetId: product.id,
                    details: { productName: product.name }
                }
            });
            await redis_1.cache.invalidatePattern(`products:*:${userId}:*`);
            await redis_1.cache.invalidatePattern('stats:*');
            log.info('Product created', { productId: product.id, userId });
            return product;
        });
    }
    static async updateProduct(productId, data, userId) {
        return prisma.$transaction(async (tx) => {
            const currentProduct = await tx.product.findUnique({
                where: { id: productId }
            });
            if (!currentProduct) {
                throw new Error('Product not found');
            }
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE_PRODUCT',
                    targetType: 'Product',
                    targetId: productId,
                    details: {
                        changes: Object.keys(data),
                        before: currentProduct,
                        after: updatedProduct
                    }
                }
            });
            await redis_1.cache.del(redis_1.CacheKeys.productDetails ? redis_1.CacheKeys.productDetails(productId) : `product:${productId}`);
            await redis_1.cache.invalidatePattern(`products:*`);
            await redis_1.cache.invalidatePattern('stats:*');
            log.info('Product updated', { productId, userId });
            return updatedProduct;
        });
    }
    static async batchUpdateStatus(productIds, status, userId) {
        return prisma.$transaction(async (tx) => {
            const result = await prisma_optimizations_2.batchOperations.updateManyProductStatus(tx, productIds, status);
            await tx.auditLog.createMany({
                data: productIds.map(productId => ({
                    userId,
                    action: 'UPDATE_PRODUCT_STATUS',
                    targetType: 'Product',
                    targetId: productId,
                    details: { newStatus: status }
                }))
            });
            await Promise.all(productIds.map(id => redis_1.cache.del(redis_1.CacheKeys.productDetails ? redis_1.CacheKeys.productDetails(id) : `product:${id}`)));
            await redis_1.cache.invalidatePattern('products:*');
            await redis_1.cache.invalidatePattern('stats:*');
            log.info('Batch product status update', { count: result.count, status, userId });
            return result;
        });
    }
    static async getProductValidationHistory(productId) {
        const cacheKey = `product:${productId}:validations`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const validations = await prisma.validation.findMany({
            where: { productId },
            include: {
                laboratory: {
                    select: {
                        name: true,
                        accreditation: true
                    }
                },
                labResults: {
                    select: {
                        testType: true,
                        result: true,
                        passed: true,
                        unit: true
                    }
                },
                prescriber: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        await redis_1.cache.set(cacheKey, validations, 600);
        return validations;
    }
}
exports.ProductService = ProductService;
const prisma_optimizations_2 = require("../utils/database/prisma-optimizations");
exports.default = ProductService;
//# sourceMappingURL=product.service.js.map