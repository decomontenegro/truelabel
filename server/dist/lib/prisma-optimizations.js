"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizedPrismaClient = exports.prismaOptimizationMiddleware = exports.QueryPerformanceMonitor = exports.searchQueries = exports.reportQueries = exports.validationQueries = exports.productQueries = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
exports.productQueries = {
    findWithFullDetails: (productId) => ({
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
    findManyOptimized: (params) => ({
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
exports.validationQueries = {
    findWithFullContext: (validationId) => ({
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
exports.reportQueries = {
    getValidationReportData: (validationId) => ({
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
exports.searchQueries = {
    searchProducts: (searchTerm, filters) => ({
        where: {
            AND: [
                {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { sku: { contains: searchTerm } },
                        { brand: { contains: searchTerm, mode: 'insensitive' } },
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
class QueryPerformanceMonitor {
    static async measureQuery(queryName, queryFn) {
        const startTime = Date.now();
        try {
            const result = await queryFn();
            const duration = Date.now() - startTime;
            logger_1.default.info(`Query performance: ${queryName}`, {
                query: queryName,
                duration,
            });
            if (duration > 1000) {
                logger_1.default.warn(`Slow query detected: ${queryName}`, {
                    query: queryName,
                    duration,
                    threshold: 1000,
                });
            }
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error(`Query failed: ${queryName}`, {
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
            logger_1.default.debug(`Slow query: ${params.model}.${params.action}`, {
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
    });
};
exports.optimizedPrismaClient = optimizedPrismaClient;
exports.default = {
    productQueries: exports.productQueries,
    validationQueries: exports.validationQueries,
    reportQueries: exports.reportQueries,
    searchQueries: exports.searchQueries,
    QueryPerformanceMonitor,
};
//# sourceMappingURL=prisma-optimizations.js.map