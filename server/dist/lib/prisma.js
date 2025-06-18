"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const metrics_1 = require("./metrics");
const logger_1 = require("./logger");
const sentry_1 = require("./sentry");
const prisma_optimizations_1 = require("../utils/database/prisma-optimizations");
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        log: env_1.isDevelopment
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        datasources: {
            db: {
                url: env_1.config.database.url,
            },
        },
        ...(env_1.isProduction && {
            datasources: {
                db: {
                    url: env_1.config.database.url + '?connection_limit=10&pool_timeout=20&connect_timeout=10',
                },
            },
        }),
    });
};
exports.prisma = global.prisma || createPrismaClient();
if (!env_1.isProduction) {
    global.prisma = exports.prisma;
}
exports.prisma.$use(prisma_optimizations_1.prismaOptimizationMiddleware);
exports.prisma.$use(async (params, next) => {
    const before = Date.now();
    const model = params.model || 'unknown';
    const action = params.action;
    try {
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;
        metrics_1.dbQueryDuration.observe({ operation: action, model }, duration / 1000);
        if (duration > 100) {
            if (env_1.isDevelopment) {
                console.warn(`⚠️ Slow query (${duration}ms): ${model}.${action}`);
            }
            logger_1.log.warn('Query lenta detectada', {
                model,
                action,
                duration,
                args: env_1.isDevelopment ? params.args : undefined
            });
            (0, sentry_1.addBreadcrumb)({
                message: `Slow database query: ${model}.${action}`,
                category: 'database',
                level: 'warning',
                data: { duration, model, action }
            });
        }
        return result;
    }
    catch (error) {
        logger_1.log.error(`Erro em Prisma ${model}.${action}`, error, {
            model,
            action
        });
        throw error;
    }
});
exports.prisma.$use(async (params, next) => {
    return next(params);
});
async function checkDatabaseConnection() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    console.log('✅ Database disconnected');
}
if (env_1.isProduction) {
    process.on('beforeExit', async () => {
        await disconnectDatabase();
    });
}
//# sourceMappingURL=prisma.js.map