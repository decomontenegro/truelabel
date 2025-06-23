import { prisma } from '../server';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class DashboardService {
  // Dashboard geral para Admin
  static async getAdminDashboard() {
    const [totalProducts, totalValidations, totalUsers, totalScans] = await Promise.all([
      prisma.product.count(),
      prisma.validation.count(),
      prisma.user.count(),
      prisma.scanLog.count(),
    ]);

    const [pendingValidations, activeProducts, recentActivities] = await Promise.all([
      prisma.validation.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'VALIDATED' } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    // Estatísticas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newProducts30d, newValidations30d, scans30d] = await Promise.all([
      prisma.product.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.validation.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.scanLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Gráficos
    const charts = await this.getChartData();

    return {
      stats: {
        totalProducts,
        totalValidations,
        totalUsers,
        totalScans,
        pendingValidations,
        activeProducts,
        growth: {
          products: this.calculateGrowth(totalProducts, newProducts30d),
          validations: this.calculateGrowth(totalValidations, newValidations30d),
          scans: this.calculateGrowth(totalScans, scans30d),
        },
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entity: activity.entity,
        user: activity.user?.name || 'Sistema',
        timestamp: activity.createdAt,
      })),
      charts,
    };
  }

  // Dashboard para Brand
  static async getBrandDashboard(brandId: string) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    const [totalProducts, validatedProducts, pendingProducts, totalScans] = await Promise.all([
      prisma.product.count({ where: { brandId } }),
      prisma.product.count({ where: { brandId, status: 'VALIDATED' } }),
      prisma.product.count({ where: { brandId, status: 'PENDING_VALIDATION' } }),
      prisma.scanLog.count({
        where: {
          qrCode: {
            product: { brandId },
          },
        },
      }),
    ]);

    // Top produtos por scans
    const topProducts = await prisma.product.findMany({
      where: { brandId },
      include: {
        qrCodes: {
          include: {
            _count: {
              select: { scanLogs: true },
            },
          },
        },
      },
      take: 5,
      orderBy: {
        qrCodes: {
          _count: 'desc',
        },
      },
    });

    // Validações recentes
    const recentValidations = await prisma.validation.findMany({
      where: {
        product: { brandId },
      },
      include: {
        product: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Certificações expirando
    const expiringCertifications = await prisma.certification.findMany({
      where: {
        product: { brandId },
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { expiresAt: 'asc' },
    });

    // Gráficos específicos da marca
    const scanTrend = await this.getScanTrend(brandId);
    const categoryDistribution = await this.getCategoryDistribution(brandId);

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        status: brand.status,
      },
      stats: {
        totalProducts,
        validatedProducts,
        pendingProducts,
        totalScans,
        validationRate: totalProducts > 0 ? (validatedProducts / totalProducts) * 100 : 0,
      },
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        scans: p.qrCodes.reduce((sum, qr) => sum + (qr as any)._count.scanLogs, 0),
      })),
      recentValidations: recentValidations.map(v => ({
        id: v.id,
        productName: v.product.name,
        status: v.status,
        createdAt: v.createdAt,
      })),
      expiringCertifications: expiringCertifications.map(c => ({
        id: c.id,
        type: c.type,
        productName: c.product.name,
        expiresAt: c.expiresAt,
        daysUntilExpiry: Math.ceil(
          ((c.expiresAt?.getTime() || 0) - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      charts: {
        scanTrend,
        categoryDistribution,
      },
    };
  }

  // Dashboard para Laboratory
  static async getLaboratoryDashboard(laboratoryId: string) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory) {
      throw new AppError('Laboratory not found', 404);
    }

    const [totalReports, completedReports, pendingReports, avgProcessingTime] = await Promise.all([
      prisma.validationReport.count({ where: { laboratoryId } }),
      prisma.validationReport.count({ where: { laboratoryId, status: 'COMPLETED' } }),
      prisma.validationReport.count({ where: { laboratoryId, status: 'PENDING' } }),
      prisma.$queryRaw<[{ avg: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as avg
        FROM "ValidationReport"
        WHERE "laboratoryId" = ${laboratoryId}
        AND status = 'COMPLETED'
      `,
    ]);

    // Relatórios recentes
    const recentReports = await prisma.validationReport.findMany({
      where: { laboratoryId },
      include: {
        validation: {
          include: {
            product: { select: { name: true, brand: { select: { name: true } } } },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Performance por mês
    const performanceByMonth = await this.getLabPerformanceByMonth(laboratoryId);

    return {
      laboratory: {
        id: laboratory.id,
        name: laboratory.name,
        status: laboratory.status,
        accreditation: laboratory.accreditation,
      },
      stats: {
        totalReports,
        completedReports,
        pendingReports,
        avgProcessingTimeHours: avgProcessingTime[0]?.avg || 0,
        completionRate: totalReports > 0 ? (completedReports / totalReports) * 100 : 0,
      },
      recentReports: recentReports.map(r => ({
        id: r.id,
        reportNumber: r.reportNumber,
        productName: r.validation.product.name,
        brandName: r.validation.product.brand.name,
        status: r.status,
        createdAt: r.createdAt,
      })),
      charts: {
        performanceByMonth,
      },
    };
  }

  // Funções auxiliares para gráficos
  private static async getChartData() {
    // Produtos por mês (6 meses)
    const productsByMonth = await this.getMonthlyData('Product', 6);
    
    // Validações por status
    const validationsByStatus = await prisma.validation.groupBy({
      by: ['status'],
      _count: true,
    });

    // Scans por dia (últimos 30 dias)
    const scansByDay = await this.getDailyScans(30);

    // Top categorias
    const topCategories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    });

    return {
      productsByMonth: productsByMonth.map(item => ({
        month: format(new Date(item.month), 'MMM', { locale: ptBR }),
        count: Number(item.count),
      })),
      validationsByStatus: validationsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      scansByDay: scansByDay.map(item => ({
        date: format(new Date(item.date), 'dd/MM'),
        count: Number(item.count),
      })),
      topCategories: topCategories.map(item => ({
        category: item.category,
        count: item._count,
      })),
    };
  }

  private static async getMonthlyData(model: string, months: number) {
    const startDate = startOfMonth(subMonths(new Date(), months - 1));
    
    const result = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as count
      FROM "${model}"
      WHERE "createdAt" >= ${startDate}
      GROUP BY month
      ORDER BY month
    `;

    return result;
  }

  private static async getDailyScans(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "ScanLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY date
      ORDER BY date
    `;

    return result;
  }

  private static async getScanTrend(brandId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(sl."createdAt") as date,
        COUNT(*) as count
      FROM "ScanLog" sl
      JOIN "QRCode" qr ON sl."qrCodeId" = qr.id
      JOIN "Product" p ON qr."productId" = p.id
      WHERE p."brandId" = ${brandId}
      AND sl."createdAt" >= ${thirtyDaysAgo}
      GROUP BY date
      ORDER BY date
    `;

    return result.map(item => ({
      date: format(new Date(item.date), 'dd/MM'),
      count: Number(item.count),
    }));
  }

  private static async getCategoryDistribution(brandId: string) {
    const result = await prisma.product.groupBy({
      by: ['category'],
      where: { brandId },
      _count: true,
    });

    return result.map(item => ({
      category: item.category,
      count: item._count,
    }));
  }

  private static async getLabPerformanceByMonth(laboratoryId: string) {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    const result = await prisma.$queryRaw<Array<{ month: string; completed: bigint; total: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(*) as total
      FROM "ValidationReport"
      WHERE "laboratoryId" = ${laboratoryId}
      AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month
    `;

    return result.map(item => ({
      month: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
      completed: Number(item.completed),
      total: Number(item.total),
      rate: Number(item.total) > 0 ? (Number(item.completed) / Number(item.total)) * 100 : 0,
    }));
  }

  private static calculateGrowth(total: number, recent: number): number {
    if (total === 0) return 0;
    const previous = total - recent;
    if (previous === 0) return 100;
    return ((recent - previous) / previous) * 100;
  }

  // Analytics avançados
  static async getAdvancedAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    brandId?: string;
    category?: string;
  }) {
    const where: any = {};
    
    if (filters?.startDate) {
      where.createdAt = { gte: filters.startDate };
    }
    if (filters?.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }
    if (filters?.brandId) {
      where.brandId = filters.brandId;
    }
    if (filters?.category) {
      where.category = filters.category;
    }

    // Análise de validações
    const validationAnalysis = await prisma.validation.groupBy({
      by: ['status'],
      where: {
        product: where,
      },
      _count: true,
      _avg: {
        aiConfidence: true,
      },
    });

    // Análise de certificações
    const certificationAnalysis = await prisma.certification.groupBy({
      by: ['type', 'verified'],
      where: {
        product: where,
      },
      _count: true,
    });

    // Análise geográfica de scans
    const geoAnalysis = await prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
      SELECT 
        sl.location->>'country' as country,
        COUNT(*) as count
      FROM "ScanLog" sl
      JOIN "QRCode" qr ON sl."qrCodeId" = qr.id
      JOIN "Product" p ON qr."productId" = p.id
      WHERE sl.location IS NOT NULL
      ${filters?.brandId ? `AND p."brandId" = '${filters.brandId}'` : ''}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    return {
      validationAnalysis: validationAnalysis.map(item => ({
        status: item.status,
        count: item._count,
        avgConfidence: item._avg.aiConfidence || 0,
      })),
      certificationAnalysis: certificationAnalysis.map(item => ({
        type: item.type,
        verified: item.verified,
        count: item._count,
      })),
      geoAnalysis: geoAnalysis.map(item => ({
        country: item.country || 'Unknown',
        count: Number(item.count),
      })),
    };
  }
}