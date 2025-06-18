"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const redis_1 = require("../lib/redis");
const prisma_optimizations_1 = require("../utils/database/prisma-optimizations");
const log = (0, logger_1.createModuleLogger)('MetricsService');
const prisma = new client_1.PrismaClient();
class MetricsService {
    static async getBusinessMetrics(dateRange) {
        const cacheKey = `metrics:business:${dateRange ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : 'all'}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const metrics = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getBusinessMetrics', async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            const [overview, growth, performance, quality, revenue, engagement] = await Promise.all([
                this.getOverviewMetrics(),
                this.getGrowthMetrics(startOfMonth, startOfLastMonth, endOfLastMonth),
                this.getPerformanceMetrics(dateRange),
                this.getQualityMetrics(dateRange),
                this.getRevenueMetrics(startOfMonth),
                this.getEngagementMetrics(now)
            ]);
            return {
                overview,
                growth,
                performance,
                quality,
                revenue,
                engagement
            };
        });
        await redis_1.cache.set(cacheKey, metrics, 3600);
        return metrics;
    }
    static async getOverviewMetrics() {
        const [totalProducts, activeProducts, totalValidations, completedValidations, totalBrands, activeBrands, qrStats] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'ACTIVE' } }),
            prisma.validation.count(),
            prisma.validation.count({ where: { status: 'VALIDATED' } }),
            prisma.brand.count(),
            prisma.brand.count({ where: { active: true } }),
            prisma.qRCodeScan.aggregate({
                _count: true,
                _min: { ipAddress: true }
            })
        ]);
        const uniqueDevices = await prisma.$queryRaw `
      SELECT COUNT(DISTINCT "userAgent") as count
      FROM "QRCodeScan"
    `;
        return {
            totalProducts,
            activeProducts,
            totalValidations,
            completedValidations,
            totalBrands,
            activeBrands,
            totalQRScans: qrStats._count || 0,
            uniqueDevices: Number(uniqueDevices[0]?.count || 0)
        };
    }
    static async getGrowthMetrics(startOfMonth, startOfLastMonth, endOfLastMonth) {
        const [productsThisMonth, productsLastMonth, validationsThisMonth, validationsLastMonth, scansThisMonth, scansLastMonth] = await Promise.all([
            prisma.product.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            prisma.product.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            }),
            prisma.validation.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            prisma.validation.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            }),
            prisma.qRCodeScan.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            prisma.qRCodeScan.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            })
        ]);
        const calculateGrowthRate = (current, previous) => {
            if (previous === 0)
                return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        return {
            productsThisMonth,
            productsLastMonth,
            productGrowthRate: calculateGrowthRate(productsThisMonth, productsLastMonth),
            validationsThisMonth,
            validationsLastMonth,
            validationGrowthRate: calculateGrowthRate(validationsThisMonth, validationsLastMonth),
            scansThisMonth,
            scansLastMonth,
            scanGrowthRate: calculateGrowthRate(scansThisMonth, scansLastMonth)
        };
    }
    static async getPerformanceMetrics(dateRange) {
        const where = dateRange ? {
            createdAt: {
                gte: dateRange.start,
                lte: dateRange.end
            }
        } : {};
        const avgValidationTime = await prisma.$queryRaw `
      SELECT AVG(EXTRACT(DAY FROM ("validatedAt" - "createdAt"))) as "avgDays"
      FROM "Validation"
      WHERE status = 'VALIDATED'
      ${dateRange ? `AND "createdAt" >= $1 AND "createdAt" <= $2` : ''}
    `;
        const [totalValidations, successfulValidations] = await Promise.all([
            prisma.validation.count({ where }),
            prisma.validation.count({
                where: {
                    ...where,
                    status: { in: ['VALIDATED', 'VALIDATED_WITH_REMARKS'] }
                }
            })
        ]);
        const validationSuccessRate = totalValidations > 0
            ? (successfulValidations / totalValidations) * 100
            : 0;
        const scanStats = await prisma.$queryRaw `
      SELECT AVG(q."scanCount") as "avgScans"
      FROM "QRCode" q
      WHERE q."isActive" = true
    `;
        const topLocations = await prisma.$queryRaw `
      SELECT location, COUNT(*) as count
      FROM "QRCodeScan"
      WHERE location IS NOT NULL
      ${dateRange ? `AND "createdAt" >= $1 AND "createdAt" <= $2` : ''}
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `;
        const peakHours = await prisma.$queryRaw `
      SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
      FROM "QRCodeScan"
      ${dateRange ? `WHERE "createdAt" >= $1 AND "createdAt" <= $2` : ''}
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 24
    `;
        return {
            avgValidationTime: avgValidationTime[0]?.avgDays || 0,
            validationSuccessRate,
            avgScansPerProduct: scanStats[0]?.avgScans || 0,
            topScanLocations: topLocations.map(loc => ({
                location: loc.location,
                count: Number(loc.count)
            })),
            peakScanHours: peakHours.map(hour => ({
                hour: Number(hour.hour),
                count: Number(hour.count)
            }))
        };
    }
    static async getQualityMetrics(dateRange) {
        const where = dateRange ? {
            createdAt: {
                gte: dateRange.start,
                lte: dateRange.end
            }
        } : {};
        const labResults = await prisma.labResult.groupBy({
            by: ['passed'],
            where: dateRange ? {
                validation: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                }
            } : {},
            _count: true
        });
        const totalTests = labResults.reduce((sum, r) => sum + r._count, 0);
        const passedTests = labResults.find(r => r.passed === true)?._count || 0;
        const validationPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        const failureReasons = await prisma.labResult.groupBy({
            by: ['notes'],
            where: {
                passed: false,
                notes: { not: null }
            },
            _count: true,
            orderBy: { _count: { notes: 'desc' } },
            take: 10
        });
        const [totalProducts, certifiedProducts] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.count({
                where: {
                    ...where,
                    certifications: {
                        some: {
                            verified: true,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ]
                        }
                    }
                }
            })
        ]);
        const certificationRate = totalProducts > 0
            ? (certifiedProducts / totalProducts) * 100
            : 0;
        return {
            validationPassRate,
            commonFailureReasons: failureReasons.map(r => ({
                reason: r.notes || 'Unknown',
                count: r._count
            })),
            avgProductRating: 4.5,
            certificationRate
        };
    }
    static async getRevenueMetrics(startOfMonth) {
        const brandCount = await prisma.brand.count({ where: { active: true } });
        const subscriptionPrice = 99;
        return {
            totalRevenue: brandCount * subscriptionPrice * 12,
            revenueThisMonth: brandCount * subscriptionPrice,
            avgRevenuePerBrand: subscriptionPrice,
            topRevenueBrands: [
                { brand: 'Brand A', revenue: 1200 },
                { brand: 'Brand B', revenue: 990 },
                { brand: 'Brand C', revenue: 850 }
            ],
            subscriptionRevenue: brandCount * subscriptionPrice,
            transactionRevenue: 0
        };
    }
    static async getEngagementMetrics(now) {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyActiveUsers = await prisma.user.count({
            where: {
                lastLogin: { gte: oneDayAgo }
            }
        });
        const monthlyActiveUsers = await prisma.user.count({
            where: {
                lastLogin: { gte: thirtyDaysAgo }
            }
        });
        const repeatScans = await prisma.$queryRaw `
      SELECT 
        (COUNT(DISTINCT CASE WHEN scan_count > 1 THEN device_id END)::float / 
         NULLIF(COUNT(DISTINCT device_id), 0) * 100) as rate
      FROM (
        SELECT "ipAddress" || "userAgent" as device_id, COUNT(*) as scan_count
        FROM "QRCodeScan"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY device_id
      ) as device_scans
    `;
        return {
            dailyActiveUsers,
            monthlyActiveUsers,
            avgSessionDuration: 5.3,
            repeatScanRate: repeatScans[0]?.rate || 0,
            userRetentionRate: 75
        };
    }
    static async getRealTimeMetrics() {
        const cacheKey = 'metrics:realtime';
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const metrics = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getRealTimeMetrics', async () => {
            const [activeUsers, recentScans, pendingValidations, recentProducts] = await Promise.all([
                prisma.user.count({
                    where: { lastLogin: { gte: oneHourAgo } }
                }),
                prisma.qRCodeScan.count({
                    where: { createdAt: { gte: oneHourAgo } }
                }),
                prisma.validation.count({
                    where: { status: 'PENDING' }
                }),
                prisma.product.count({
                    where: { createdAt: { gte: oneDayAgo } }
                })
            ]);
            return {
                activeUsers,
                recentScans,
                pendingValidations,
                recentProducts,
                timestamp: now
            };
        });
        await redis_1.cache.set(cacheKey, metrics, 60);
        return metrics;
    }
    static async exportMetricsReport(format, dateRange) {
        const metrics = await this.getBusinessMetrics(dateRange);
        if (format === 'json') {
            return JSON.stringify(metrics, null, 2);
        }
        const csvRows = [
            'Metric,Value',
            `Total Products,${metrics.overview.totalProducts}`,
            `Active Products,${metrics.overview.activeProducts}`,
            `Total Validations,${metrics.overview.totalValidations}`,
            `Completed Validations,${metrics.overview.completedValidations}`,
            `Total Brands,${metrics.overview.totalBrands}`,
            `Active Brands,${metrics.overview.activeBrands}`,
            `Total QR Scans,${metrics.overview.totalQRScans}`,
            `Unique Devices,${metrics.overview.uniqueDevices}`,
            '',
            'Growth Metrics',
            `Products This Month,${metrics.growth.productsThisMonth}`,
            `Product Growth Rate,${metrics.growth.productGrowthRate.toFixed(2)}%`,
            `Validations This Month,${metrics.growth.validationsThisMonth}`,
            `Validation Growth Rate,${metrics.growth.validationGrowthRate.toFixed(2)}%`,
            `Scans This Month,${metrics.growth.scansThisMonth}`,
            `Scan Growth Rate,${metrics.growth.scanGrowthRate.toFixed(2)}%`,
            '',
            'Performance Metrics',
            `Avg Validation Time (days),${metrics.performance.avgValidationTime.toFixed(2)}`,
            `Validation Success Rate,${metrics.performance.validationSuccessRate.toFixed(2)}%`,
            `Avg Scans Per Product,${metrics.performance.avgScansPerProduct.toFixed(2)}`,
            '',
            'Quality Metrics',
            `Validation Pass Rate,${metrics.quality.validationPassRate.toFixed(2)}%`,
            `Certification Rate,${metrics.quality.certificationRate.toFixed(2)}%`,
            '',
            'Revenue Metrics',
            `Total Revenue,$${metrics.revenue.totalRevenue.toFixed(2)}`,
            `Revenue This Month,$${metrics.revenue.revenueThisMonth.toFixed(2)}`,
            `Avg Revenue Per Brand,$${metrics.revenue.avgRevenuePerBrand.toFixed(2)}`,
            '',
            'Engagement Metrics',
            `Daily Active Users,${metrics.engagement.dailyActiveUsers}`,
            `Monthly Active Users,${metrics.engagement.monthlyActiveUsers}`,
            `Repeat Scan Rate,${metrics.engagement.repeatScanRate.toFixed(2)}%`,
            `User Retention Rate,${metrics.engagement.userRetentionRate.toFixed(2)}%`
        ];
        return csvRows.join('\n');
    }
}
exports.MetricsService = MetricsService;
exports.default = MetricsService;
//# sourceMappingURL=metricsService.js.map