"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const metricsService_1 = require("../services/metricsService");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/metrics', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let dateRange;
        if (start && end) {
            dateRange = {
                start: new Date(start),
                end: new Date(end)
            };
            if (dateRange.start > dateRange.end) {
                throw (0, errorHandler_1.createError)('Invalid date range', 400);
            }
            const maxRange = 365 * 24 * 60 * 60 * 1000;
            if (dateRange.end.getTime() - dateRange.start.getTime() > maxRange) {
                throw (0, errorHandler_1.createError)('Date range cannot exceed 1 year', 400);
            }
        }
        const metrics = await metricsService_1.MetricsService.getBusinessMetrics(dateRange);
        res.json({
            success: true,
            data: metrics,
            dateRange: dateRange || { start: null, end: null }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/realtime', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const metrics = await metricsService_1.MetricsService.getRealTimeMetrics();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/export', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { format = 'csv', start, end } = req.query;
        if (!['csv', 'json'].includes(format)) {
            throw (0, errorHandler_1.createError)('Invalid export format. Use "csv" or "json"', 400);
        }
        let dateRange;
        if (start && end) {
            dateRange = {
                start: new Date(start),
                end: new Date(end)
            };
        }
        const report = await metricsService_1.MetricsService.exportMetricsReport(format, dateRange);
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(report);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.json`);
            res.send(report);
        }
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/brand/:brandId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { brandId } = req.params;
        const { start, end } = req.query;
        const userBrand = await prisma.brand.findFirst({
            where: {
                id: brandId,
                users: {
                    some: { id: req.user.id }
                }
            }
        });
        if (!userBrand && req.user.role !== 'ADMIN') {
            throw (0, errorHandler_1.createError)('Access denied', 403);
        }
        let dateRange;
        if (start && end) {
            dateRange = {
                start: new Date(start),
                end: new Date(end)
            };
        }
        const { BrandService } = await Promise.resolve().then(() => __importStar(require('../services/brand.service')));
        const dashboardData = await BrandService.getDashboardData(brandId, dateRange);
        const analytics = await BrandService.getBrandAnalytics(brandId, 'month');
        const topProducts = await BrandService.getTopProducts(brandId, 10, 'scans');
        const complianceScore = await BrandService.getComplianceScore(brandId);
        res.json({
            success: true,
            data: {
                dashboard: dashboardData,
                analytics,
                topProducts,
                complianceScore
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/products', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { limit = 20, metric = 'scans', brandId } = req.query;
        let where = {};
        if (req.user.role === 'BRAND') {
            const userBrand = await prisma.brand.findFirst({
                where: {
                    users: {
                        some: { id: req.user.id }
                    }
                }
            });
            if (!userBrand) {
                throw (0, errorHandler_1.createError)('No brand associated with user', 403);
            }
            where.brandId = userBrand.id;
        }
        else if (brandId && req.user.role === 'ADMIN') {
            where.brandId = brandId;
        }
        const products = await prisma.product.findMany({
            where,
            include: {
                brand: {
                    select: { name: true }
                },
                qrCodes: {
                    where: { isActive: true },
                    select: {
                        scanCount: true,
                        _count: {
                            select: { scans: true }
                        }
                    }
                },
                validations: {
                    where: { status: 'VALIDATED' },
                    select: { id: true }
                },
                _count: {
                    select: {
                        validations: true,
                        certifications: true
                    }
                }
            },
            take: Number(limit)
        });
        const sortedProducts = products
            .map(product => ({
            id: product.id,
            name: product.name,
            brand: product.brand.name,
            totalScans: product.qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0),
            validations: product._count.validations,
            certifications: product._count.certifications,
            status: product.status
        }))
            .sort((a, b) => {
            switch (metric) {
                case 'scans':
                    return b.totalScans - a.totalScans;
                case 'validations':
                    return b.validations - a.validations;
                case 'certifications':
                    return b.certifications - a.certifications;
                default:
                    return 0;
            }
        });
        res.json({
            success: true,
            data: sortedProducts,
            metric: metric
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/validations', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { laboratoryId, status, dateRange = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (dateRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const where = {
            createdAt: { gte: startDate }
        };
        if (laboratoryId) {
            where.laboratoryId = laboratoryId;
        }
        if (status) {
            where.status = status;
        }
        if (req.user.role === 'LABORATORY') {
            const userLab = await prisma.laboratory.findFirst({
                where: {
                    users: {
                        some: { id: req.user.id }
                    }
                }
            });
            if (!userLab) {
                throw (0, errorHandler_1.createError)('No laboratory associated with user', 403);
            }
            where.laboratoryId = userLab.id;
        }
        const { ValidationService } = await Promise.resolve().then(() => __importStar(require('../services/validation.service')));
        const stats = await ValidationService.getValidationStats({
            laboratoryId: where.laboratoryId,
            dateRange: { start: startDate, end: now }
        });
        res.json({
            success: true,
            data: stats,
            dateRange: {
                start: startDate,
                end: now
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/scans', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { productId, qrCode, groupBy = 'day', limit = 30 } = req.query;
        const where = {};
        if (productId) {
            where.qrCode = { productId };
        }
        if (qrCode) {
            where.qrCode = { code: qrCode };
        }
        if (req.user.role === 'BRAND') {
            const userBrand = await prisma.brand.findFirst({
                where: {
                    users: {
                        some: { id: req.user.id }
                    }
                }
            });
            if (!userBrand) {
                throw (0, errorHandler_1.createError)('No brand associated with user', 403);
            }
            where.qrCode = {
                ...where.qrCode,
                product: { brandId: userBrand.id }
            };
        }
        const scans = await prisma.qRCodeScan.findMany({
            where,
            select: {
                id: true,
                createdAt: true,
                location: true,
                userAgent: true,
                qrCode: {
                    select: {
                        code: true,
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit)
        });
        const groupedData = scans.reduce((acc, scan) => {
            let key;
            const date = new Date(scan.createdAt);
            switch (groupBy) {
                case 'hour':
                    key = `${date.toISOString().slice(0, 13)}:00`;
                    break;
                case 'day':
                    key = date.toISOString().slice(0, 10);
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().slice(0, 10);
                    break;
                case 'month':
                    key = date.toISOString().slice(0, 7);
                    break;
                default:
                    key = date.toISOString().slice(0, 10);
            }
            if (!acc[key]) {
                acc[key] = {
                    period: key,
                    count: 0,
                    uniqueLocations: new Set(),
                    products: new Map()
                };
            }
            acc[key].count++;
            if (scan.location) {
                acc[key].uniqueLocations.add(scan.location);
            }
            const productKey = scan.qrCode.product.id;
            const productCount = acc[key].products.get(productKey) || 0;
            acc[key].products.set(productKey, productCount + 1);
            return acc;
        }, {});
        const analytics = Object.values(groupedData)
            .map((group) => ({
            period: group.period,
            scans: group.count,
            uniqueLocations: group.uniqueLocations.size,
            topProduct: Array.from(group.products.entries())
                .sort((a, b) => b[1] - a[1])[0]
        }))
            .sort((a, b) => a.period.localeCompare(b.period));
        res.json({
            success: true,
            data: analytics,
            groupBy,
            total: scans.length
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics/engagement', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [activeUsers, newUsers, sessions, avgSessionDuration] = await Promise.all([
            prisma.user.count({
                where: {
                    lastLogin: { gte: startDate }
                }
            }),
            prisma.user.count({
                where: {
                    createdAt: { gte: startDate }
                }
            }),
            prisma.auditLog.count({
                where: {
                    action: 'LOGIN',
                    createdAt: { gte: startDate }
                }
            }),
            5.3
        ]);
        const dailyActiveUsers = await prisma.$queryRaw `
      SELECT DATE("lastLogin") as date, COUNT(DISTINCT id) as count
      FROM "User"
      WHERE "lastLogin" >= ${startDate}
      GROUP BY DATE("lastLogin")
      ORDER BY date ASC
    `;
        res.json({
            success: true,
            data: {
                summary: {
                    activeUsers,
                    newUsers,
                    sessions,
                    avgSessionDuration
                },
                trend: dailyActiveUsers.map(d => ({
                    date: d.date,
                    users: Number(d.count)
                }))
            },
            period
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map