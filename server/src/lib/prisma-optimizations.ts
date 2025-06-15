import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

// Optimized query builders to prevent N+1 problems

/**
 * Product query optimizations
 */
export const productQueries = {
  // Get product with all related data in single query
  findWithFullDetails: (productId: string) => ({
    where: { id: productId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      validations: {
        where: {
          status: {
            in: ['APPROVED', 'PENDING'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          report: {
            include: {
              laboratory: {
                select: {
                  id: true,
                  name: true,
                  accreditation: true,
                },
              },
            },
          },
        },
      },
      seals: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          imageUrl: true,
          issuedBy: true,
          validUntil: true,
        },
      },
      _count: {
        select: {
          validations: true,
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
      sku: true,
      category: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      validations: {
        where: {
          status: 'APPROVED',
        },
        select: {
          id: true,
          createdAt: true,
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          validations: true,
          seals: true,
        },
      },
    },
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      report: {
        include: {
          laboratory: true,
        },
      },
      validator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
          user: true,
          seals: true,
        },
      },
      report: {
        include: {
          laboratory: true,
        },
      },
      validator: {
        select: {
          name: true,
          email: true,
        },
      },
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
    userId?: string;
  }) => ({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
            { sku: { contains: searchTerm } },
            { brand: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        },
        ...(filters?.category ? [{ category: filters.category }] : []),
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.userId ? [{ userId: filters.userId }] : []),
      ],
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      validations: {
        where: {
          status: 'APPROVED',
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
      
      logger.info(`Query performance: ${queryName}`, {
        query: queryName,
        duration,
      });
      
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${queryName}`, {
          query: queryName,
          duration,
          threshold: 1000,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Query failed: ${queryName}`, {
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
      logger.debug(`Slow query: ${params.model}.${params.action}`, {
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
  });
};

export default {
  productQueries,
  validationQueries,
  reportQueries,
  searchQueries,
  QueryPerformanceMonitor,
};