"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const redis_1 = require("../lib/redis");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma = new client_1.PrismaClient();
class CacheWarmingService {
    constructor() {
        this.isRunning = false;
    }
    start() {
        if (this.isRunning) {
            console.log('⚠️ Cache warming service já está em execução');
            return;
        }
        this.isRunning = true;
        console.log('🔥 Iniciando serviço de cache warming...');
        this.warmCache();
        node_cron_1.default.schedule('*/30 * * * *', () => {
            console.log('🔄 Executando cache warming agendado...');
            this.warmCache();
        });
        node_cron_1.default.schedule('*/10 * * * *', () => {
            this.warmPopularProducts();
        });
        node_cron_1.default.schedule('0 * * * *', () => {
            this.warmStatistics();
        });
    }
    async warmCache() {
        try {
            await Promise.all([
                this.warmLaboratories(),
                this.warmRecentProducts(),
                this.warmValidationQueue(),
                this.warmUserSessions()
            ]);
            console.log('✅ Cache warming concluído');
        }
        catch (error) {
            console.error('❌ Erro no cache warming:', error);
        }
    }
    async warmLaboratories() {
        try {
            const laboratories = await prisma.laboratory.findMany({
                select: {
                    id: true,
                    name: true,
                    accreditation: true,
                    email: true,
                    phone: true,
                    status: true
                },
                where: {
                    status: 'ACTIVE'
                }
            });
            await redis_1.cache.set(redis_1.CacheKeys.laboratoryList(), laboratories, redis_1.CacheTTL.long);
            await Promise.all(laboratories.map(lab => redis_1.cache.set(redis_1.CacheKeys.laboratory(lab.id), lab, redis_1.CacheTTL.long)));
            console.log(`📦 ${laboratories.length} laboratórios aquecidos no cache`);
        }
        catch (error) {
            console.error('Erro ao aquecer laboratórios:', error);
        }
    }
    async warmRecentProducts() {
        try {
            const recentProducts = await prisma.product.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
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
                }
            });
            await Promise.all(recentProducts.map(product => redis_1.cache.set(redis_1.CacheKeys.product(product.id), product, redis_1.CacheTTL.medium)));
            await Promise.all(recentProducts.map(product => redis_1.cache.set(redis_1.CacheKeys.productBySku(product.sku), product.id, redis_1.CacheTTL.long)));
            console.log(`📦 ${recentProducts.length} produtos recentes aquecidos no cache`);
        }
        catch (error) {
            console.error('Erro ao aquecer produtos recentes:', error);
        }
    }
    async warmPopularProducts() {
        try {
            const popularProductIds = [];
            const popularProducts = await prisma.product.findMany({
                take: 20,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    validations: {
                        select: { status: true, validatedAt: true }
                    },
                    _count: {
                        select: { reports: true, validations: true }
                    }
                },
                orderBy: {
                    validations: {
                        _count: 'desc'
                    }
                }
            });
            await Promise.all(popularProducts.map(product => redis_1.cache.set(redis_1.CacheKeys.product(product.id), product, redis_1.CacheTTL.medium)));
            console.log(`🔥 ${popularProducts.length} produtos populares aquecidos no cache`);
        }
        catch (error) {
            console.error('Erro ao aquecer produtos populares:', error);
        }
    }
    async warmValidationQueue() {
        try {
            const pendingValidations = await prisma.validation.findMany({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    createdAt: true
                }
            });
            await redis_1.cache.del(redis_1.CacheKeys.validationQueue());
            for (const validation of pendingValidations) {
                await redis_1.cache.zadd(redis_1.CacheKeys.validationQueue(), new Date(validation.createdAt).getTime(), validation.id);
            }
            console.log(`📦 ${pendingValidations.length} validações pendentes aquecidas no cache`);
        }
        catch (error) {
            console.error('Erro ao aquecer fila de validações:', error);
        }
    }
    async warmStatistics() {
        try {
            const [totalProducts, totalValidations, totalReports, approvedValidations] = await Promise.all([
                prisma.product.count(),
                prisma.validation.count(),
                prisma.report.count(),
                prisma.validation.count({ where: { status: 'APPROVED' } })
            ]);
            const globalStats = {
                products: totalProducts,
                validations: totalValidations,
                reports: totalReports,
                approvalRate: totalValidations > 0
                    ? (approvedValidations / totalValidations * 100).toFixed(1)
                    : 0
            };
            await redis_1.cache.set(redis_1.CacheKeys.analytics('global-stats', 'all'), globalStats, redis_1.CacheTTL.medium);
            const topBrands = await prisma.user.findMany({
                where: { role: 'BRAND' },
                take: 10,
                select: {
                    id: true,
                    _count: {
                        select: { products: true }
                    }
                },
                orderBy: {
                    products: {
                        _count: 'desc'
                    }
                }
            });
            for (const brand of topBrands) {
                if (brand._count.products > 0) {
                    const brandStats = await this.calculateUserStats(brand.id);
                    await redis_1.cache.set(redis_1.CacheKeys.analytics('validation-stats', brand.id), brandStats, redis_1.CacheTTL.medium);
                }
            }
            console.log('📊 Estatísticas aquecidas no cache');
        }
        catch (error) {
            console.error('Erro ao aquecer estatísticas:', error);
        }
    }
    async warmUserSessions() {
        try {
            const recentUsers = await prisma.user.findMany({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                },
                select: {
                    id: true,
                    email: true,
                    role: true
                }
            });
            await Promise.all(recentUsers.map(user => redis_1.cache.set(redis_1.CacheKeys.userByEmail(user.email), user, redis_1.CacheTTL.medium)));
            console.log(`👥 ${recentUsers.length} usuários ativos pré-carregados`);
        }
        catch (error) {
            console.error('Erro ao aquecer sessões:', error);
        }
    }
    async calculateUserStats(userId) {
        const where = { product: { userId } };
        const [total, approved, rejected, partial, pending] = await Promise.all([
            prisma.validation.count({ where }),
            prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
            prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
            prisma.validation.count({ where: { ...where, status: 'PARTIAL' } }),
            prisma.validation.count({ where: { ...where, status: 'PENDING' } })
        ]);
        return {
            overview: {
                total,
                approved,
                rejected,
                partial,
                pending
            }
        };
    }
    async cleanup() {
        try {
            const patterns = [
                'products:*:*',
                'analytics:*:*'
            ];
            for (const pattern of patterns) {
                const deleted = await redis_1.cache.clearPattern(pattern);
                if (deleted > 0) {
                    console.log(`🧹 ${deleted} chaves removidas para padrão: ${pattern}`);
                }
            }
        }
        catch (error) {
            console.error('Erro ao limpar cache:', error);
        }
    }
}
exports.default = new CacheWarmingService();
//# sourceMappingURL=cacheWarmingService.js.map