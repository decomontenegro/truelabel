import { PrismaClient, Prisma } from '@prisma/client';
import { log } from '../../lib/logger';

// Use the log utility directly

// Optimized query builders to prevent N+1 problems

/**
 * Product query optimizations
 */
export const productQueries = {
  // Get product with all related data in single query
  findWithFullDetails: (productId: string) => ({
    where: { id: productId },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          logo: true,
          website: true,
        },
      },
      validations: {
        where: {
          status: {
            in: ['VALIDATED', 'VALIDATED_WITH_REMARKS'],
          },
          validUntil: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          laboratory: {
            select: {
              id: true,
              name: true,
              accreditation: true,
            },
          },
          labResults: {
            select: {
              id: true,
              testType: true,
              result: true,
              unit: true,
              reference: true,
              passed: true,
            },
          },
        },
      },
      certifications: {
        where: {
          verified: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          type: true,
          number: true,
          issuer: true,
          issuedAt: true,
          expiresAt: true,
        },
      },
      qrCodes: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          code: true,
          shortUrl: true,
          scanCount: true,
        },
      },
      _count: {
        select: {
          validations: true,
          qrCodes: true,
          certifications: true,
        },
      },
    },
  }),

  // Efficient list query with pagination
  findManyOptimized: (params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) => ({
    skip: params.skip,
    take: params.take,
    where: params.where,
    orderBy: params.orderBy,
    select: {
      id: true,
      name: true,
      description: true,
      ean: true,
      category: true,
      status: true,
      images: true,
      createdAt: true,
      brand: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      validations: {
        where: {
          status: 'VALIDATED',
          validUntil: { gt: new Date() },
        },
        select: {
          id: true,
          validatedAt: true,
          validUntil: true,
        },
        take: 1,
        orderBy: { validatedAt: 'desc' },
      },
      _count: {
        select: {
          validations: true,
          qrCodes: true,
        },
      },
    },
  }),

  // Dashboard statistics query
  getDashboardStats: (brandId?: string) => ({
    where: brandId ? { brandId } : {},
    select: {
      status: true,
      _count: true,
    },
    groupBy: ['status'],
  }),
};

/**
 * Validation query optimizations
 */
export const validationQueries = {
  // Get validation with full context
  findWithFullContext: (validationId: string) => ({
    where: { id: validationId },
    include: {
      product: {
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      laboratory: {
        select: {
          id: true,
          name: true,
          email: true,
          accreditation: true,
          accreditationBody: true,
        },
      },
      labResults: {
        orderBy: { createdAt: 'asc' },
      },
      prescriber: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          action: true,
          details: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  }),

  // Efficient validation list for laboratory
  findManyForLaboratory: (laboratoryId: string, params: {
    skip?: number;
    take?: number;
    status?: string[];
  }) => ({
    where: {
      laboratoryId,
      ...(params.status && { status: { in: params.status } }),
    },
    skip: params.skip,
    take: params.take,
    select: {
      id: true,
      status: true,
      priority: true,
      createdAt: true,
      validatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          ean: true,
          brand: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          labResults: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  }),
};

/**
 * QR Code query optimizations
 */
export const qrCodeQueries = {
  // Get QR code with scan analytics
  findWithAnalytics: (code: string, dateRange?: { start: Date; end: Date }) => ({
    where: { code },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          status: true,
          brand: {
            select: {
              name: true,
            },
          },
        },
      },
      scans: {
        where: dateRange ? {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        } : {},
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          referrer: true,
          location: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit for performance
      },
      _count: {
        select: {
          scans: true,
        },
      },
    },
  }),

  // Batch QR code generation query
  findExistingCodes: (productIds: string[]) => ({
    where: {
      productId: { in: productIds },
      isActive: true,
    },
    select: {
      productId: true,
      code: true,
      shortUrl: true,
    },
  }),
};

/**
 * Brand dashboard query optimizations
 */
export const brandQueries = {
  // Get brand dashboard data in single query
  getDashboardData: (brandId: string, dateRange: { start: Date; end: Date }) => ({
    where: { id: brandId },
    include: {
      products: {
        select: {
          id: true,
          status: true,
          validations: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            select: {
              status: true,
              createdAt: true,
            },
          },
          qrCodes: {
            where: { isActive: true },
            select: {
              scanCount: true,
              scans: {
                where: {
                  createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end,
                  },
                },
                select: {
                  id: true,
                },
              },
            },
          },
          _count: {
            select: {
              validations: true,
              qrCodes: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  }),

  // Get brand with related entities count
  findWithCounts: (brandId: string) => ({
    where: { id: brandId },
    include: {
      _count: {
        select: {
          products: true,
          users: true,
        },
      },
    },
  }),
};

/**
 * Report generation query optimizations
 */
export const reportQueries = {
  // Get validation report data efficiently
  getValidationReportData: (validationId: string) => ({
    where: { id: validationId },
    include: {
      product: {
        include: {
          brand: true,
          certifications: {
            where: { verified: true },
          },
        },
      },
      laboratory: true,
      labResults: {
        orderBy: { testType: 'asc' },
      },
      prescriber: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  }),

  // Get monthly statistics efficiently
  getMonthlyStats: (brandId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return {
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        createdAt: true,
        validations: {
          select: {
            status: true,
            createdAt: true,
            validatedAt: true,
          },
        },
        qrCodes: {
          select: {
            scanCount: true,
            scans: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
        },
      },
    };
  },
};

/**
 * Notification query optimizations
 */
export const notificationQueries = {
  // Get unread notifications with minimal data
  findUnreadOptimized: (userId: string, limit: number = 10) => ({
    where: {
      userId,
      read: false,
    },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      data: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }),

  // Mark notifications as read in batch
  markManyAsRead: (notificationIds: string[]) => ({
    where: {
      id: { in: notificationIds },
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  }),
};

/**
 * Search query optimizations
 */
export const searchQueries = {
  // Full-text search with relevance
  searchProducts: (searchTerm: string, filters?: {
    category?: string;
    status?: string;
    brandId?: string;
  }) => ({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
            { ean: { contains: searchTerm } },
            { brand: { name: { contains: searchTerm, mode: 'insensitive' as const } } },
          ],
        },
        ...(filters?.category ? [{ category: filters.category }] : []),
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.brandId ? [{ brandId: filters.brandId }] : []),
      ],
    },
    include: {
      brand: {
        select: {
          name: true,
          logo: true,
        },
      },
      validations: {
        where: {
          status: 'VALIDATED',
          validUntil: { gt: new Date() },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
    take: 20,
  }),
};

/**
 * Batch operations optimizations
 */
export const batchOperations = {
  // Create multiple validations efficiently
  createManyValidations: async (
    prisma: PrismaClient,
    validations: Array<{
      productId: string;
      laboratoryId: string;
      tests: string[];
      priority?: string;
    }>
  ) => {
    // Check for existing validations in single query
    const existingValidations = await prisma.validation.findMany({
      where: {
        OR: validations.map(v => ({
          productId: v.productId,
          laboratoryId: v.laboratoryId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        })),
      },
      select: {
        productId: true,
        laboratoryId: true,
      },
    });

    const existingSet = new Set(
      existingValidations.map(v => `${v.productId}-${v.laboratoryId}`)
    );

    // Filter out duplicates
    const newValidations = validations.filter(
      v => !existingSet.has(`${v.productId}-${v.laboratoryId}`)
    );

    // Create all validations in single transaction
    return prisma.$transaction(
      newValidations.map(v =>
        prisma.validation.create({
          data: {
            productId: v.productId,
            laboratoryId: v.laboratoryId,
            tests: v.tests,
            priority: v.priority || 'normal',
            status: 'PENDING',
          },
        })
      )
    );
  },

  // Update multiple products status
  updateManyProductStatus: async (
    prisma: PrismaClient,
    productIds: string[],
    status: string
  ) => {
    return prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  },
};

/**
 * Performance monitoring for queries
 */
export class QueryPerformanceMonitor {
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      log.logPerformanceMetric(`query_${queryName}`, duration);
      
      if (duration > 1000) {
        log.warn(`Slow query detected: ${queryName}`, {
          query: queryName,
          duration,
          threshold: 1000,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Query failed: ${queryName}`, {
        query: queryName,
        duration,
        error,
      });
      throw error;
    }
  }
}

/**
 * Prisma middleware for query optimization
 */
export const prismaOptimizationMiddleware: Prisma.Middleware = async (params, next) => {
  const startTime = Date.now();
  
  // Log slow queries in development
  if (process.env.NODE_ENV === 'development') {
    const result = await next(params);
    const duration = Date.now() - startTime;
    
    if (duration > 100) {
      log.debug(`Slow query: ${params.model}.${params.action}`, {
        model: params.model,
        action: params.action,
        duration,
        args: params.args,
      });
    }
    
    return result;
  }
  
  return next(params);
};

/**
 * Connection pool optimization
 */
export const optimizedPrismaClient = () => {
  return new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'info', emit: 'event' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export default {
  productQueries,
  validationQueries,
  qrCodeQueries,
  brandQueries,
  reportQueries,
  notificationQueries,
  searchQueries,
  batchOperations,
  QueryPerformanceMonitor,
};