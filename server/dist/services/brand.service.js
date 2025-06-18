"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const client_1 = require("@prisma/client");
const prisma_optimizations_1 = require("../utils/database/prisma-optimizations");
const redis_1 = require("../lib/redis");
const logger_1 = require("../utils/logger");
const log = (0, logger_1.createModuleLogger)('BrandService');
const prisma = new client_1.PrismaClient();
class BrandService {
    static async getDashboardData(brandId, dateRange) {
        const cacheKey = `brand:${brandId}:dashboard:${dateRange ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : 'all'}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            log.debug('Brand dashboard loaded from cache', { brandId });
            return cached;
        }
        const range = dateRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
        };
        const dashboardData = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getBrandDashboard', async () => {
            const brand = await prisma.brand.findUnique(prisma_optimizations_1.brandQueries.getDashboardData(brandId, range));
            if (!brand) {
                throw new Error('Brand not found');
            }
            const stats = {
                totalProducts: brand._count.products,
                productsByStatus: {},
                validationStats: {
                    total: 0,
                    pending: 0,
                    inProgress: 0,
                    validated: 0,
                    rejected: 0
                },
                scanStats: {
                    total: 0,
                    period: 0,
                    uniqueDevices: new Set()
                },
                topProducts: []
            };
            brand.products.forEach(product => {
                stats.productsByStatus[product.status] = (stats.productsByStatus[product.status] || 0) + 1;
                product.validations.forEach(validation => {
                    stats.validationStats.total++;
                    switch (validation.status) {
                        case 'PENDING':
                            stats.validationStats.pending++;
                            break;
                        case 'IN_PROGRESS':
                            stats.validationStats.inProgress++;
                            break;
                        case 'VALIDATED':
                        case 'VALIDATED_WITH_REMARKS':
                            stats.validationStats.validated++;
                            break;
                        case 'REJECTED':
                            stats.validationStats.rejected++;
                            break;
                    }
                });
                let productScans = 0;
                product.qrCodes.forEach(qr => {
                    stats.scanStats.total += qr.scanCount;
                    productScans += qr.scans.length;
                    qr.scans.forEach(scan => {
                        stats.scanStats.period++;
                    });
                });
                if (productScans > 0) {
                    stats.topProducts.push({
                        id: product.id,
                        name: product.name,
                        scans: productScans,
                        validations: product._count.validations
                    });
                }
            });
            stats.topProducts.sort((a, b) => b.scans - a.scans);
            stats.topProducts = stats.topProducts.slice(0, 10);
            return {
                brand: {
                    id: brand.id,
                    name: brand.name,
                    logo: brand.logo,
                    totalProducts: stats.totalProducts
                },
                stats,
                dateRange: range
            };
        });
        await redis_1.cache.set(cacheKey, dashboardData, 600);
        return dashboardData;
    }
    static async getBrandWithCounts(brandId) {
        const cacheKey = `brand:${brandId}:counts`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const brand = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getBrandWithCounts', () => prisma.brand.findUnique(prisma_optimizations_1.brandQueries.findWithCounts(brandId)));
        if (brand) {
            await redis_1.cache.set(cacheKey, brand, 300);
        }
        return brand;
    }
    static async getBrandAnalytics(brandId, period = 'month') {
        const cacheKey = `brand:${brandId}:analytics:${period}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const analytics = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getBrandAnalytics', async () => {
            const endDate = new Date();
            let startDate;
            let groupBy;
            switch (period) {
                case 'day':
                    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    groupBy = 'hour';
                    break;
                case 'week':
                    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    groupBy = 'day';
                    break;
                case 'month':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    groupBy = 'day';
                    break;
                case 'year':
                    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                    groupBy = 'month';
                    break;
            }
            const scanAnalytics = await prisma.$queryRaw `
          SELECT 
            DATE_TRUNC(${groupBy}, s."createdAt") as period,
            COUNT(*) as scans,
            COUNT(DISTINCT q."productId") as "uniqueProducts"
          FROM "QRCodeScan" s
          JOIN "QRCode" q ON s."qrCodeId" = q.id
          JOIN "Product" p ON q."productId" = p.id
          WHERE p."brandId" = ${brandId}
          AND s."createdAt" >= ${startDate}
          AND s."createdAt" <= ${endDate}
          GROUP BY period
          ORDER BY period ASC
        `;
            const validationAnalytics = await prisma.$queryRaw `
          SELECT 
            DATE_TRUNC(${groupBy}, v."createdAt") as period,
            COUNT(*) as validations,
            COUNT(CASE WHEN v.status = 'VALIDATED' THEN 1 END) as validated,
            COUNT(CASE WHEN v.status = 'REJECTED' THEN 1 END) as rejected
          FROM "Validation" v
          JOIN "Product" p ON v."productId" = p.id
          WHERE p."brandId" = ${brandId}
          AND v."createdAt" >= ${startDate}
          AND v."createdAt" <= ${endDate}
          GROUP BY period
          ORDER BY period ASC
        `;
            const productGrowth = await prisma.$queryRaw `
          SELECT 
            DATE_TRUNC(${groupBy}, "createdAt") as period,
            COUNT(*) as products
          FROM "Product"
          WHERE "brandId" = ${brandId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
          GROUP BY period
          ORDER BY period ASC
        `;
            return {
                period,
                dateRange: { start: startDate, end: endDate },
                scans: scanAnalytics.map(row => ({
                    period: row.period,
                    scans: Number(row.scans),
                    uniqueProducts: Number(row.uniqueProducts)
                })),
                validations: validationAnalytics.map(row => ({
                    period: row.period,
                    total: Number(row.validations),
                    validated: Number(row.validated),
                    rejected: Number(row.rejected)
                })),
                productGrowth: productGrowth.map(row => ({
                    period: row.period,
                    count: Number(row.products)
                }))
            };
        });
        const ttl = period === 'day' ? 300 : period === 'week' ? 600 : 1800;
        await redis_1.cache.set(cacheKey, analytics, ttl);
        return analytics;
    }
    static async getTopProducts(brandId, limit = 10, metric = 'scans') {
        const cacheKey = `brand:${brandId}:top-products:${metric}:${limit}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const topProducts = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getTopProducts', async () => {
            if (metric === 'scans') {
                const products = await prisma.$queryRaw `
            SELECT 
              p.id as "productId",
              p.name as "productName",
              SUM(q."scanCount") as "totalScans",
              COUNT(DISTINCT s."ipAddress") as "uniqueDevices",
              MAX(s."createdAt") as "lastScan"
            FROM "Product" p
            JOIN "QRCode" q ON p.id = q."productId"
            LEFT JOIN "QRCodeScan" s ON q.id = s."qrCodeId"
            WHERE p."brandId" = ${brandId}
            AND q."isActive" = true
            GROUP BY p.id, p.name
            ORDER BY "totalScans" DESC
            LIMIT ${limit}
          `;
                return products.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    totalScans: Number(p.totalScans),
                    uniqueDevices: Number(p.uniqueDevices),
                    lastScan: p.lastScan
                }));
            }
            else {
                const products = await prisma.$queryRaw `
            SELECT 
              p.id as "productId",
              p.name as "productName",
              COUNT(v.id) as "totalValidations",
              COUNT(CASE WHEN v.status = 'VALIDATED' THEN 1 END) as "validatedCount",
              AVG(EXTRACT(DAY FROM (v."validatedAt" - v."createdAt"))) as "avgProcessingDays"
            FROM "Product" p
            LEFT JOIN "Validation" v ON p.id = v."productId"
            WHERE p."brandId" = ${brandId}
            GROUP BY p.id, p.name
            HAVING COUNT(v.id) > 0
            ORDER BY "totalValidations" DESC
            LIMIT ${limit}
          `;
                return products.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    totalValidations: Number(p.totalValidations),
                    validatedCount: Number(p.validatedCount),
                    avgProcessingDays: p.avgProcessingDays || 0
                }));
            }
        });
        await redis_1.cache.set(cacheKey, topProducts, 1800);
        return topProducts;
    }
    static async getComplianceScore(brandId) {
        const cacheKey = `brand:${brandId}:compliance-score`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const score = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getComplianceScore', async () => {
            const [products, validations, certifications] = await Promise.all([
                prisma.product.groupBy({
                    by: ['status'],
                    where: { brandId },
                    _count: true
                }),
                prisma.validation.groupBy({
                    by: ['status'],
                    where: {
                        product: { brandId },
                        validUntil: { gt: new Date() }
                    },
                    _count: true
                }),
                prisma.certification.count({
                    where: {
                        product: { brandId },
                        verified: true,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                })
            ]);
            const totalProducts = products.reduce((sum, p) => sum + p._count, 0);
            const validatedProducts = products.find(p => p.status === 'VALIDATED')?._count || 0;
            const activeValidations = validations.find(v => v.status === 'VALIDATED')?._count || 0;
            const productScore = totalProducts > 0 ? (validatedProducts / totalProducts) * 100 : 0;
            const validationScore = totalProducts > 0 ? (activeValidations / totalProducts) * 100 : 0;
            const certificationScore = totalProducts > 0 ? (certifications / totalProducts) * 100 : 0;
            const overallScore = (productScore * 0.4 + validationScore * 0.4 + certificationScore * 0.2);
            return {
                overallScore: Math.round(overallScore),
                breakdown: {
                    productCompliance: Math.round(productScore),
                    validationCompliance: Math.round(validationScore),
                    certificationCompliance: Math.round(certificationScore)
                },
                details: {
                    totalProducts,
                    validatedProducts,
                    activeValidations,
                    activeCertifications: certifications
                }
            };
        });
        await redis_1.cache.set(cacheKey, score, 3600);
        return score;
    }
}
exports.BrandService = BrandService;
exports.default = BrandService;
//# sourceMappingURL=brand.service.js.map