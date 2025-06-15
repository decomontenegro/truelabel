import { PrismaClient } from '@prisma/client';
import { brandQueries, QueryPerformanceMonitor } from '../utils/database/prisma-optimizations';
import { cache } from '../lib/redis';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('BrandService');
const prisma = new PrismaClient();

export interface DateRange {
  start: Date;
  end: Date;
}

export class BrandService {
  /**
   * Get brand dashboard data with optimized queries
   */
  static async getDashboardData(brandId: string, dateRange?: DateRange) {
    const cacheKey = `brand:${brandId}:dashboard:${dateRange ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : 'all'}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      log.debug('Brand dashboard loaded from cache', { brandId });
      return cached;
    }

    const range = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };

    const dashboardData = await QueryPerformanceMonitor.measureQuery(
      'getBrandDashboard',
      async () => {
        const brand = await prisma.brand.findUnique(brandQueries.getDashboardData(brandId, range));

        if (!brand) {
          throw new Error('Brand not found');
        }

        // Process the data
        const stats = {
          totalProducts: brand._count.products,
          productsByStatus: {} as Record<string, number>,
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
            uniqueDevices: new Set<string>()
          },
          topProducts: [] as any[]
        };

        // Process products
        brand.products.forEach(product => {
          // Count by status
          stats.productsByStatus[product.status] = (stats.productsByStatus[product.status] || 0) + 1;

          // Count validations
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

          // Count scans
          let productScans = 0;
          product.qrCodes.forEach(qr => {
            stats.scanStats.total += qr.scanCount;
            productScans += qr.scans.length;
            qr.scans.forEach(scan => {
              stats.scanStats.period++;
              // Would need to parse userAgent for unique devices
            });
          });

          // Track top products by scans
          if (productScans > 0) {
            stats.topProducts.push({
              id: product.id,
              name: product.name,
              scans: productScans,
              validations: product._count.validations
            });
          }
        });

        // Sort top products
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
      }
    );

    // Cache for 10 minutes
    await cache.set(cacheKey, dashboardData, 600);

    return dashboardData;
  }

  /**
   * Get brand with counts
   */
  static async getBrandWithCounts(brandId: string) {
    const cacheKey = `brand:${brandId}:counts`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const brand = await QueryPerformanceMonitor.measureQuery(
      'getBrandWithCounts',
      () => prisma.brand.findUnique(brandQueries.findWithCounts(brandId))
    );

    if (brand) {
      await cache.set(cacheKey, brand, 300);
    }

    return brand;
  }

  /**
   * Get brand analytics
   */
  static async getBrandAnalytics(brandId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const cacheKey = `brand:${brandId}:analytics:${period}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const analytics = await QueryPerformanceMonitor.measureQuery(
      'getBrandAnalytics',
      async () => {
        // Calculate date range based on period
        const endDate = new Date();
        let startDate: Date;
        let groupBy: string;

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

        // Get scan analytics
        const scanAnalytics = await prisma.$queryRaw<Array<{
          period: string;
          scans: bigint;
          uniqueProducts: bigint;
        }>>`
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

        // Get validation analytics
        const validationAnalytics = await prisma.$queryRaw<Array<{
          period: string;
          validations: bigint;
          validated: bigint;
          rejected: bigint;
        }>>`
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

        // Get product growth
        const productGrowth = await prisma.$queryRaw<Array<{
          period: string;
          products: bigint;
        }>>`
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
      }
    );

    // Cache based on period
    const ttl = period === 'day' ? 300 : period === 'week' ? 600 : 1800;
    await cache.set(cacheKey, analytics, ttl);

    return analytics;
  }

  /**
   * Get top performing products
   */
  static async getTopProducts(brandId: string, limit: number = 10, metric: 'scans' | 'validations' = 'scans') {
    const cacheKey = `brand:${brandId}:top-products:${metric}:${limit}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const topProducts = await QueryPerformanceMonitor.measureQuery(
      'getTopProducts',
      async () => {
        if (metric === 'scans') {
          const products = await prisma.$queryRaw<Array<{
            productId: string;
            productName: string;
            totalScans: bigint;
            uniqueDevices: bigint;
            lastScan: Date;
          }>>`
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
        } else {
          const products = await prisma.$queryRaw<Array<{
            productId: string;
            productName: string;
            totalValidations: bigint;
            validatedCount: bigint;
            avgProcessingDays: number;
          }>>`
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
      }
    );

    // Cache for 30 minutes
    await cache.set(cacheKey, topProducts, 1800);

    return topProducts;
  }

  /**
   * Get brand compliance score
   */
  static async getComplianceScore(brandId: string) {
    const cacheKey = `brand:${brandId}:compliance-score`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const score = await QueryPerformanceMonitor.measureQuery(
      'getComplianceScore',
      async () => {
        const [products, validations, certifications] = await Promise.all([
          // Product compliance
          prisma.product.groupBy({
            by: ['status'],
            where: { brandId },
            _count: true
          }),

          // Validation compliance
          prisma.validation.groupBy({
            by: ['status'],
            where: { 
              product: { brandId },
              validUntil: { gt: new Date() }
            },
            _count: true
          }),

          // Certification compliance
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

        // Calculate scores
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
      }
    );

    // Cache for 1 hour
    await cache.set(cacheKey, score, 3600);

    return score;
  }
}

export default BrandService;