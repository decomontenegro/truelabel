"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const client_1 = require("@prisma/client");
const prisma_optimizations_1 = require("../utils/database/prisma-optimizations");
const redis_1 = require("../lib/redis");
const logger_1 = require("../utils/logger");
const websocketService_1 = require("./websocketService");
const log = (0, logger_1.createModuleLogger)('ValidationService');
const prisma = new client_1.PrismaClient();
class ValidationService {
    static async getValidations(filters, pagination, userRole, userId) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        let where = {};
        if (filters.status && filters.status.length > 0) {
            where.status = { in: filters.status };
        }
        if (filters.priority) {
            where.priority = filters.priority;
        }
        if (filters.productId) {
            where.productId = filters.productId;
        }
        if (userRole === 'LABORATORY' && userId) {
            const lab = await prisma.laboratory.findFirst({
                where: { users: { some: { id: userId } } }
            });
            if (lab) {
                where.laboratoryId = lab.id;
            }
        }
        else if (userRole === 'BRAND' && userId) {
            where.product = { brand: { users: { some: { id: userId } } } };
        }
        if (filters.laboratoryId) {
            where.laboratoryId = filters.laboratoryId;
        }
        const result = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getValidations', async () => {
            const queryParams = filters.laboratoryId
                ? prisma_optimizations_1.validationQueries.findManyForLaboratory(filters.laboratoryId, { skip, take: limit, status: filters.status })
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
                prisma.validation.findMany(queryParams),
                prisma.validation.count({ where })
            ]);
            return { validations, total };
        });
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
    static async getValidationDetails(validationId) {
        const cacheKey = `validation:${validationId}:details`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            log.debug('Validation details loaded from cache', { validationId });
            return cached;
        }
        const validation = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getValidationDetails', () => prisma.validation.findUnique(prisma_optimizations_1.validationQueries.findWithFullContext(validationId)));
        if (validation) {
            await redis_1.cache.set(cacheKey, validation, 300);
        }
        return validation;
    }
    static async createValidation(data, requestedBy) {
        return prisma.$transaction(async (tx) => {
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
            await tx.product.update({
                where: { id: data.productId },
                data: { status: 'IN_VALIDATION' }
            });
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
            labUsers.forEach(user => {
                websocketService_1.websocketService.sendToUser(user.id, 'new_validation', {
                    validationId: validation.id,
                    productName: validation.product.name,
                    brandName: validation.product.brand.name
                });
            });
            await redis_1.cache.invalidatePattern('validations:*');
            await redis_1.cache.invalidatePattern(`product:${data.productId}:*`);
            log.info('Validation created', {
                validationId: validation.id,
                productId: data.productId,
                laboratoryId: data.laboratoryId
            });
            return validation;
        });
    }
    static async createBatchValidations(validations, requestedBy) {
        const result = await prisma_optimizations_1.batchOperations.createManyValidations(prisma, validations.map(v => ({
            ...v,
            priority: v.priority || 'normal'
        })));
        await redis_1.cache.invalidatePattern('validations:*');
        const productIds = [...new Set(validations.map(v => v.productId))];
        await Promise.all(productIds.map(id => redis_1.cache.invalidatePattern(`product:${id}:*`)));
        log.info('Batch validations created', {
            count: result.length,
            requestedBy
        });
        return result;
    }
    static async updateValidationStatus(validationId, status, userId, details) {
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
            const updated = await tx.validation.update({
                where: { id: validationId },
                data: {
                    status,
                    ...(status === 'VALIDATED' && {
                        validatedAt: new Date(),
                        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    }),
                    ...details
                }
            });
            if (status === 'VALIDATED') {
                await tx.product.update({
                    where: { id: validation.productId },
                    data: { status: 'VALIDATED' }
                });
            }
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
                brandUserIds.forEach(uid => {
                    websocketService_1.websocketService.sendToUser(uid, 'validation_status_update', {
                        validationId,
                        productId: validation.productId,
                        productName: validation.product.name,
                        status
                    });
                });
            }
            await redis_1.cache.del(`validation:${validationId}:details`);
            await redis_1.cache.invalidatePattern('validations:*');
            await redis_1.cache.invalidatePattern(`product:${validation.productId}:*`);
            log.info('Validation status updated', {
                validationId,
                previousStatus: validation.status,
                newStatus: status,
                userId
            });
            return updated;
        });
    }
    static async addLabResults(validationId, results, userId) {
        return prisma.$transaction(async (tx) => {
            const labResults = await tx.labResult.createMany({
                data: results.map(r => ({
                    ...r,
                    validationId
                }))
            });
            const validation = await tx.validation.findUnique({
                where: { id: validationId }
            });
            if (validation?.status === 'PENDING') {
                await tx.validation.update({
                    where: { id: validationId },
                    data: { status: 'IN_PROGRESS' }
                });
            }
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
            await redis_1.cache.del(`validation:${validationId}:details`);
            await redis_1.cache.invalidatePattern(`product:${validation?.productId}:*`);
            log.info('Lab results added', {
                validationId,
                resultsCount: results.length,
                userId
            });
            return labResults;
        });
    }
    static async getValidationStats(filters) {
        const cacheKey = `stats:validations:${JSON.stringify(filters || {})}`;
        const cached = await redis_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const stats = await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getValidationStats', async () => {
            const where = {};
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
                prisma.validation.groupBy({
                    by: ['status'],
                    where,
                    _count: true
                }),
                prisma.validation.groupBy({
                    by: ['priority'],
                    where: {
                        ...where,
                        status: { in: ['PENDING', 'IN_PROGRESS'] }
                    },
                    _count: true
                }),
                prisma.$queryRaw `
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
                }, {}),
                byPriority: priorityStats.reduce((acc, stat) => {
                    acc[stat.priority] = stat._count;
                    return acc;
                }, {}),
                averageProcessingDays: avgProcessingTime[0]?.avgDays || 0,
                total: statusStats.reduce((sum, stat) => sum + stat._count, 0)
            };
        });
        await redis_1.cache.set(cacheKey, stats, 900);
        return stats;
    }
}
exports.ValidationService = ValidationService;
exports.default = ValidationService;
//# sourceMappingURL=validation.service.js.map