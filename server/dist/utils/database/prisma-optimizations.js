"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizedPrismaClient = exports.prismaOptimizationMiddleware = exports.QueryPerformanceMonitor = exports.batchOperations = exports.searchQueries = exports.notificationQueries = exports.reportQueries = exports.brandQueries = exports.qrCodeQueries = exports.validationQueries = exports.productQueries = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../lib/logger");
exports.productQueries = {
    findWithFullDetails: (productId) => ({
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
    findManyOptimized: (params) => ({
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
    getDashboardStats: (brandId) => ({
        where: brandId ? { brandId } : {},
        select: {
            status: true,
            _count: true,
        },
        groupBy: ['status'],
    }),
};
exports.validationQueries = {
    findWithFullContext: (validationId) => ({
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
    findManyForLaboratory: (laboratoryId, params) => ({
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
exports.qrCodeQueries = {
    findWithAnalytics: (code, dateRange) => ({
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
                take: 100,
            },
            _count: {
                select: {
                    scans: true,
                },
            },
        },
    }),
    findExistingCodes: (productIds) => ({
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
exports.brandQueries = {
    getDashboardData: (brandId, dateRange) => ({
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
    findWithCounts: (brandId) => ({
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
exports.reportQueries = {
    getValidationReportData: (validationId) => ({
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
    getMonthlyStats: (brandId, year, month) => {
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
exports.notificationQueries = {
    findUnreadOptimized: (userId, limit = 10) => ({
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
    markManyAsRead: (notificationIds) => ({
        where: {
            id: { in: notificationIds },
        },
        data: {
            read: true,
            readAt: new Date(),
        },
    }),
};
exports.searchQueries = {
    searchProducts: (searchTerm, filters) => ({
        where: {
            AND: [
                {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { ean: { contains: searchTerm } },
                        { brand: { name: { contains: searchTerm, mode: 'insensitive' } } },
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
exports.batchOperations = {
    createManyValidations: async (prisma, validations) => {
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
        const existingSet = new Set(existingValidations.map(v => `${v.productId}-${v.laboratoryId}`));
        const newValidations = validations.filter(v => !existingSet.has(`${v.productId}-${v.laboratoryId}`));
        return prisma.$transaction(newValidations.map(v => prisma.validation.create({
            data: {
                productId: v.productId,
                laboratoryId: v.laboratoryId,
                tests: v.tests,
                priority: v.priority || 'normal',
                status: 'PENDING',
            },
        })));
    },
    updateManyProductStatus: async (prisma, productIds, status) => {
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
class QueryPerformanceMonitor {
    static async measureQuery(queryName, queryFn) {
        const startTime = Date.now();
        try {
            const result = await queryFn();
            const duration = Date.now() - startTime;
            logger_1.log.logPerformanceMetric(`query_${queryName}`, duration);
            if (duration > 1000) {
                logger_1.log.warn(`Slow query detected: ${queryName}`, {
                    query: queryName,
                    duration,
                    threshold: 1000,
                });
            }
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.log.error(`Query failed: ${queryName}`, {
                query: queryName,
                duration,
                error,
            });
            throw error;
        }
    }
}
exports.QueryPerformanceMonitor = QueryPerformanceMonitor;
const prismaOptimizationMiddleware = async (params, next) => {
    const startTime = Date.now();
    if (process.env.NODE_ENV === 'development') {
        const result = await next(params);
        const duration = Date.now() - startTime;
        if (duration > 100) {
            logger_1.log.debug(`Slow query: ${params.model}.${params.action}`, {
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
exports.prismaOptimizationMiddleware = prismaOptimizationMiddleware;
const optimizedPrismaClient = () => {
    return new client_1.PrismaClient({
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
exports.optimizedPrismaClient = optimizedPrismaClient;
exports.default = {
    productQueries: exports.productQueries,
    validationQueries: exports.validationQueries,
    qrCodeQueries: exports.qrCodeQueries,
    brandQueries: exports.brandQueries,
    reportQueries: exports.reportQueries,
    notificationQueries: exports.notificationQueries,
    searchQueries: exports.searchQueries,
    batchOperations: exports.batchOperations,
    QueryPerformanceMonitor,
};
//# sourceMappingURL=prisma-optimizations.js.map