import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { MetricsService } from '../services/metricsService';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get comprehensive business metrics (Admin only)
router.get('/metrics', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    
    let dateRange;
    if (start && end) {
      dateRange = {
        start: new Date(start as string),
        end: new Date(end as string)
      };
      
      // Validate date range
      if (dateRange.start > dateRange.end) {
        throw createError('Invalid date range', 400);
      }
      
      // Max 1 year range
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if (dateRange.end.getTime() - dateRange.start.getTime() > maxRange) {
        throw createError('Date range cannot exceed 1 year', 400);
      }
    }
    
    const metrics = await MetricsService.getBusinessMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics,
      dateRange: dateRange || { start: null, end: null }
    });
  } catch (error) {
    next(error);
  }
});

// Get real-time metrics
router.get('/metrics/realtime', authenticateToken, async (req, res, next) => {
  try {
    const metrics = await MetricsService.getRealTimeMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

// Export metrics report
router.get('/metrics/export', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { format = 'csv', start, end } = req.query;
    
    if (!['csv', 'json'].includes(format as string)) {
      throw createError('Invalid export format. Use "csv" or "json"', 400);
    }
    
    let dateRange;
    if (start && end) {
      dateRange = {
        start: new Date(start as string),
        end: new Date(end as string)
      };
    }
    
    const report = await MetricsService.exportMetricsReport(
      format as 'csv' | 'json',
      dateRange
    );
    
    // Set appropriate headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(report);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=metrics-${new Date().toISOString().split('T')[0]}.json`);
      res.send(report);
    }
  } catch (error) {
    next(error);
  }
});

// Get brand-specific metrics
router.get('/metrics/brand/:brandId', authenticateToken, async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const { start, end } = req.query;
    
    // Check if user has access to this brand
    const userBrand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        users: {
          some: { id: req.user!.id }
        }
      }
    });
    
    if (!userBrand && req.user!.role !== 'ADMIN') {
      throw createError('Access denied', 403);
    }
    
    let dateRange;
    if (start && end) {
      dateRange = {
        start: new Date(start as string),
        end: new Date(end as string)
      };
    }
    
    // Get brand-specific metrics
    const { BrandService } = await import('../services/brand.service');
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
  } catch (error) {
    next(error);
  }
});

// Get product performance metrics
router.get('/metrics/products', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, metric = 'scans', brandId } = req.query;
    
    // Build query based on user role
    let where: any = {};
    
    if (req.user!.role === 'BRAND') {
      const userBrand = await prisma.brand.findFirst({
        where: {
          users: {
            some: { id: req.user!.id }
          }
        }
      });
      
      if (!userBrand) {
        throw createError('No brand associated with user', 403);
      }
      
      where.brandId = userBrand.id;
    } else if (brandId && req.user!.role === 'ADMIN') {
      where.brandId = brandId;
    }
    
    // Get top performing products
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
    
    // Sort by metric
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
      metric: metric as string
    });
  } catch (error) {
    next(error);
  }
});

// Get validation performance metrics
router.get('/metrics/validations', authenticateToken, async (req, res, next) => {
  try {
    const { laboratoryId, status, dateRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
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
    
    const where: any = {
      createdAt: { gte: startDate }
    };
    
    if (laboratoryId) {
      where.laboratoryId = laboratoryId;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Check user permissions
    if (req.user!.role === 'LABORATORY') {
      const userLab = await prisma.laboratory.findFirst({
        where: {
          users: {
            some: { id: req.user!.id }
          }
        }
      });
      
      if (!userLab) {
        throw createError('No laboratory associated with user', 403);
      }
      
      where.laboratoryId = userLab.id;
    }
    
    // Get validation metrics
    const { ValidationService } = await import('../services/validation.service');
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
  } catch (error) {
    next(error);
  }
});

// Get QR code scan analytics
router.get('/metrics/scans', authenticateToken, async (req, res, next) => {
  try {
    const { productId, qrCode, groupBy = 'day', limit = 30 } = req.query;
    
    const where: any = {};
    
    if (productId) {
      where.qrCode = { productId };
    }
    
    if (qrCode) {
      where.qrCode = { code: qrCode };
    }
    
    // Check user permissions
    if (req.user!.role === 'BRAND') {
      const userBrand = await prisma.brand.findFirst({
        where: {
          users: {
            some: { id: req.user!.id }
          }
        }
      });
      
      if (!userBrand) {
        throw createError('No brand associated with user', 403);
      }
      
      where.qrCode = {
        ...where.qrCode,
        product: { brandId: userBrand.id }
      };
    }
    
    // Get scan data
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
    
    // Group by time period
    const groupedData = scans.reduce((acc, scan) => {
      let key: string;
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
    }, {} as Record<string, any>);
    
    // Convert to array format
    const analytics = Object.values(groupedData)
      .map((group: any) => ({
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
  } catch (error) {
    next(error);
  }
});

// Get user engagement metrics
router.get('/metrics/engagement', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    let startDate: Date;
    
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
    
    // Get engagement data
    const [
      activeUsers,
      newUsers,
      sessions,
      avgSessionDuration
    ] = await Promise.all([
      // Active users
      prisma.user.count({
        where: {
          lastLogin: { gte: startDate }
        }
      }),
      
      // New users
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Sessions (simplified - count logins)
      prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: startDate }
        }
      }),
      
      // Average session duration (placeholder)
      5.3 // In production, implement proper session tracking
    ]);
    
    // Calculate daily active users trend
    const dailyActiveUsers = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
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
  } catch (error) {
    next(error);
  }
});

const prisma = new PrismaClient();

export default router;