"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.instrumentPrismaClient = instrumentPrismaClient;
exports.createInstrumentedPrismaClient = createInstrumentedPrismaClient;
exports.getPrismaMetrics = getPrismaMetrics;
const client_1 = require("@prisma/client");
const metrics_1 = require("./metrics");
const logger_1 = require("./logger");
const sentry_1 = require("./sentry");
function instrumentPrismaClient(prisma) {
    prisma.$use(async (params, next) => {
        const startTime = Date.now();
        const model = params.model || 'unknown';
        const action = params.action;
        try {
            const result = await next(params);
            const duration = Date.now() - startTime;
            metrics_1.dbQueryDuration.observe({ operation: action, model }, duration / 1000);
            if (duration > 100) {
                logger_1.log.warn('Query lenta detectada', {
                    model,
                    action,
                    duration,
                    args: params.args
                });
                (0, sentry_1.addBreadcrumb)({
                    message: `Slow database query: ${model}.${action}`,
                    category: 'database',
                    level: 'warning',
                    data: {
                        duration,
                        model,
                        action
                    }
                });
            }
            if (process.env.NODE_ENV === 'development') {
                logger_1.log.debug(`Prisma ${model}.${action}`, {
                    duration,
                    args: params.args
                });
            }
            return result;
        }
        catch (error) {
            logger_1.log.error(`Erro em Prisma ${model}.${action}`, error, {
                model,
                action,
                args: params.args
            });
            throw error;
        }
    });
    prisma.$use(async (params, next) => {
        const result = await next(params);
        if (params.action === 'create' || params.action === 'createMany') {
            const model = params.model?.toLowerCase() || 'unknown';
            switch (model) {
                case 'product':
                    const { productMetrics } = await Promise.resolve().then(() => __importStar(require('./metrics')));
                    productMetrics.created.inc({
                        category: params.args?.data?.category || 'unknown',
                        brand: params.args?.data?.brand || 'unknown'
                    });
                    break;
                case 'validation':
                    const { validationTotal } = await Promise.resolve().then(() => __importStar(require('./metrics')));
                    validationTotal.inc({
                        type: params.args?.data?.type || 'unknown',
                        status: params.args?.data?.status || 'unknown'
                    });
                    break;
                case 'report':
                    const { reportMetrics } = await Promise.resolve().then(() => __importStar(require('./metrics')));
                    reportMetrics.uploaded.inc({
                        laboratory: 'unknown',
                        analysis_type: params.args?.data?.analysisType || 'unknown'
                    });
                    break;
            }
        }
        return result;
    });
    return prisma;
}
function createInstrumentedPrismaClient() {
    const prisma = new client_1.PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
    prisma.$on('query', (e) => {
        if (e.duration > 100) {
            logger_1.log.warn('Query SQL lenta', {
                query: e.query,
                params: e.params,
                duration: e.duration,
                target: e.target
            });
        }
    });
    prisma.$on('error', (e) => {
        logger_1.log.error('Erro do Prisma', new Error(e.message), {
            target: e.target,
            timestamp: e.timestamp
        });
    });
    prisma.$on('warn', (e) => {
        logger_1.log.warn('Aviso do Prisma', {
            message: e.message,
            target: e.target,
            timestamp: e.timestamp
        });
    });
    return instrumentPrismaClient(prisma);
}
async function getPrismaMetrics(prisma) {
    try {
        await prisma.$queryRaw `SELECT 1`;
        const metrics = await prisma.$metrics.json();
        return {
            healthy: true,
            metrics
        };
    }
    catch (error) {
        return {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
//# sourceMappingURL=prisma-instrumentation.js.map