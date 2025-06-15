import { PrismaClient } from '@prisma/client';
import { validationQueries, QueryPerformanceMonitor, batchOperations } from '../utils/database/prisma-optimizations';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';
import { createModuleLogger } from '../utils/logger';
import { websocketService } from './websocketService';

const log = createModuleLogger('ValidationService');
const prisma = new PrismaClient();

export interface ValidationFilter {
  status?: string[];
  laboratoryId?: string;
  productId?: string;
  priority?: string;
}

export interface CreateValidationData {
  productId: string;
  laboratoryId: string;
  tests: string[];
  priority?: string;
  notes?: string;
}

export class ValidationService {
  /**
   * Get validations with optimized queries
   */
  static async getValidations(
    filters: ValidationFilter,
    pagination: { page: number; limit: number },
    userRole?: string,
    userId?: string
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on role
    let where: any = {};

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    // Role-based filtering
    if (userRole === 'LABORATORY' && userId) {
      const lab = await prisma.laboratory.findFirst({
        where: { users: { some: { id: userId } } }
      });
      if (lab) {
        where.laboratoryId = lab.id;
      }
    } else if (userRole === 'BRAND' && userId) {
      where.product = { brand: { users: { some: { id: userId } } } };
    }

    if (filters.laboratoryId) {
      where.laboratoryId = filters.laboratoryId;
    }

    // Execute optimized query
    const result = await QueryPerformanceMonitor.measureQuery(
      'getValidations',
      async () => {
        const queryParams = filters.laboratoryId 
          ? validationQueries.findManyForLaboratory(filters.laboratoryId, { skip, take: limit, status: filters.status })
          : {
              where,
              skip,
              take: limit,
              select: {
                id: true,
                status: true,
                priority: true,
                tests: true,
                createdAt: true,
                validatedAt: true,
                validUntil: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    ean: true,
                    images: true,
                    brand: {
                      select: {
                        id: true,
                        name: true,
                        logo: true
                      }
                    }
                  }
                },
                laboratory: {
                  select: {
                    id: true,
                    name: true,
                    accreditation: true
                  }
                },
                _count: {
                  select: {
                    labResults: true
                  }
                }
              },
              orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
              ]
            };

        const [validations, total] = await Promise.all([
          prisma.validation.findMany(queryParams as any),
          prisma.validation.count({ where })
        ]);

        return { validations, total };
      }
    );

    return {
      validations: result.validations,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
        hasMore: page * limit < result.total
      }
    };
  }

  /**
   * Get validation details with full context
   */
  static async getValidationDetails(validationId: string) {
    const cacheKey = `validation:${validationId}:details`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      log.debug('Validation details loaded from cache', { validationId });
      return cached;
    }

    const validation = await QueryPerformanceMonitor.measureQuery(
      'getValidationDetails',
      () => prisma.validation.findUnique(validationQueries.findWithFullContext(validationId))
    );

    if (validation) {
      await cache.set(cacheKey, validation, 300); // Cache for 5 minutes
    }

    return validation;
  }

  /**
   * Create validation with optimizations
   */
  static async createValidation(data: CreateValidationData, requestedBy: string) {
    return prisma.$transaction(async (tx) => {
      // Check if validation already exists
      const existing = await tx.validation.findFirst({
        where: {
          productId: data.productId,
          laboratoryId: data.laboratoryId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      if (existing) {
        throw new Error('Validation already exists for this product and laboratory');
      }

      // Create validation
      const validation = await tx.validation.create({
        data: {
          productId: data.productId,
          laboratoryId: data.laboratoryId,
          tests: data.tests,
          priority: data.priority || 'normal',
          status: 'PENDING',
          notes: data.notes,
          prescriberId: requestedBy
        },
        include: {
          product: {
            select: {
              name: true,
              brand: {
                select: { name: true }
              }
            }
          },
          laboratory: {
            select: { name: true }
          }
        }
      });

      // Update product status
      await tx.product.update({
        where: { id: data.productId },
        data: { status: 'IN_VALIDATION' }
      });

      // Create notification for laboratory
      const labUsers = await tx.user.findMany({
        where: { 
          laboratory: { id: data.laboratoryId },
          role: { in: ['LABORATORY', 'LAB_ANALYST'] }
        }
      });

      await tx.notification.createMany({
        data: labUsers.map(user => ({
          userId: user.id,
          type: 'NEW_VALIDATION_REQUEST',
          title: 'Nova Solicitação de Validação',
          message: `Nova validação solicitada para ${validation.product.name}`,
          data: { validationId: validation.id }
        }))
      });

      // Send websocket notifications
      labUsers.forEach(user => {
        websocketService.sendToUser(user.id, 'new_validation', {
          validationId: validation.id,
          productName: validation.product.name,
          brandName: validation.product.brand.name
        });
      });

      // Clear cache
      await cache.invalidatePattern('validations:*');
      await cache.invalidatePattern(`product:${data.productId}:*`);

      log.info('Validation created', { 
        validationId: validation.id, 
        productId: data.productId,
        laboratoryId: data.laboratoryId 
      });

      return validation;
    });
  }

  /**
   * Create multiple validations in batch
   */
  static async createBatchValidations(
    validations: CreateValidationData[],
    requestedBy: string
  ) {
    const result = await batchOperations.createManyValidations(
      prisma,
      validations.map(v => ({
        ...v,
        priority: v.priority || 'normal'
      }))
    );

    // Clear cache
    await cache.invalidatePattern('validations:*');
    
    const productIds = [...new Set(validations.map(v => v.productId))];
    await Promise.all(
      productIds.map(id => cache.invalidatePattern(`product:${id}:*`))
    );

    log.info('Batch validations created', { 
      count: result.length,
      requestedBy 
    });

    return result;
  }

  /**
   * Update validation status
   */
  static async updateValidationStatus(
    validationId: string,
    status: string,
    userId: string,
    details?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const validation = await tx.validation.findUnique({
        where: { id: validationId },
        include: {
          product: {
            include: {
              brand: {
                select: {
                  users: {
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!validation) {
        throw new Error('Validation not found');
      }

      // Update validation
      const updated = await tx.validation.update({
        where: { id: validationId },
        data: {
          status,
          ...(status === 'VALIDATED' && {
            validatedAt: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }),
          ...details
        }
      });

      // Update product status if needed
      if (status === 'VALIDATED') {
        await tx.product.update({
          where: { id: validation.productId },
          data: { status: 'VALIDATED' }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_VALIDATION_STATUS',
          targetType: 'Validation',
          targetId: validationId,
          details: {
            previousStatus: validation.status,
            newStatus: status,
            ...details
          }
        }
      });

      // Notify brand users
      if (status === 'VALIDATED' || status === 'REJECTED') {
        const brandUserIds = validation.product.brand.users.map(u => u.id);
        
        await tx.notification.createMany({
          data: brandUserIds.map(uid => ({
            userId: uid,
            type: 'VALIDATION_STATUS_UPDATE',
            title: status === 'VALIDATED' ? 'Validação Aprovada' : 'Validação Rejeitada',
            message: `A validação do produto ${validation.product.name} foi ${status === 'VALIDATED' ? 'aprovada' : 'rejeitada'}`,
            data: { validationId, productId: validation.productId }
          }))
        });

        // Send websocket notifications
        brandUserIds.forEach(uid => {
          websocketService.sendToUser(uid, 'validation_status_update', {
            validationId,
            productId: validation.productId,
            productName: validation.product.name,
            status
          });
        });
      }

      // Clear cache
      await cache.del(`validation:${validationId}:details`);
      await cache.invalidatePattern('validations:*');
      await cache.invalidatePattern(`product:${validation.productId}:*`);

      log.info('Validation status updated', { 
        validationId, 
        previousStatus: validation.status,
        newStatus: status,
        userId 
      });

      return updated;
    });
  }

  /**
   * Add lab results to validation
   */
  static async addLabResults(
    validationId: string,
    results: Array<{
      testType: string;
      result: string;
      unit?: string;
      reference?: string;
      passed: boolean;
      notes?: string;
    }>,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Create lab results
      const labResults = await tx.labResult.createMany({
        data: results.map(r => ({
          ...r,
          validationId
        }))
      });

      // Update validation status to IN_PROGRESS if still PENDING
      const validation = await tx.validation.findUnique({
        where: { id: validationId }
      });

      if (validation?.status === 'PENDING') {
        await tx.validation.update({
          where: { id: validationId },
          data: { status: 'IN_PROGRESS' }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ADD_LAB_RESULTS',
          targetType: 'Validation',
          targetId: validationId,
          details: {
            resultsCount: results.length,
            testTypes: results.map(r => r.testType)
          }
        }
      });

      // Clear cache
      await cache.del(`validation:${validationId}:details`);
      await cache.invalidatePattern(`product:${validation?.productId}:*`);

      log.info('Lab results added', { 
        validationId, 
        resultsCount: results.length,
        userId 
      });

      return labResults;
    });
  }

  /**
   * Get validation statistics
   */
  static async getValidationStats(filters?: {
    laboratoryId?: string;
    brandId?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const cacheKey = `stats:validations:${JSON.stringify(filters || {})}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await QueryPerformanceMonitor.measureQuery(
      'getValidationStats',
      async () => {
        const where: any = {};

        if (filters?.laboratoryId) {
          where.laboratoryId = filters.laboratoryId;
        }

        if (filters?.brandId) {
          where.product = { brandId: filters.brandId };
        }

        if (filters?.dateRange) {
          where.createdAt = {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          };
        }

        const [statusStats, priorityStats, avgProcessingTime] = await Promise.all([
          // Status distribution
          prisma.validation.groupBy({
            by: ['status'],
            where,
            _count: true
          }),

          // Priority distribution
          prisma.validation.groupBy({
            by: ['priority'],
            where: {
              ...where,
              status: { in: ['PENDING', 'IN_PROGRESS'] }
            },
            _count: true
          }),

          // Average processing time
          prisma.$queryRaw<[{ avgDays: number }]>`
            SELECT AVG(EXTRACT(DAY FROM ("validatedAt" - "createdAt"))) as "avgDays"
            FROM "Validation"
            WHERE status = 'VALIDATED'
            ${filters?.laboratoryId ? `AND "laboratoryId" = ${filters.laboratoryId}` : ''}
            ${filters?.dateRange ? `AND "createdAt" >= ${filters.dateRange.start} AND "createdAt" <= ${filters.dateRange.end}` : ''}
          `
        ]);

        return {
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          }, {} as Record<string, number>),
          byPriority: priorityStats.reduce((acc, stat) => {
            acc[stat.priority] = stat._count;
            return acc;
          }, {} as Record<string, number>),
          averageProcessingDays: avgProcessingTime[0]?.avgDays || 0,
          total: statusStats.reduce((sum, stat) => sum + stat._count, 0)
        };
      }
    );

    // Cache for 15 minutes
    await cache.set(cacheKey, stats, 900);

    return stats;
  }
}

export default ValidationService;