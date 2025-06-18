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
const cron = __importStar(require("node-cron"));
const bullmq_1 = require("bullmq");
const logger_1 = require("../utils/logger");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const log = (0, logger_1.createModuleLogger)('CronJobs');
const prisma = (0, prisma_1.getPrismaClient)();
const queueConfig = {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    },
};
const validationExpiryQueue = new bullmq_1.Queue('validation-expiry', queueConfig);
const reportCleanupQueue = new bullmq_1.Queue('report-cleanup', queueConfig);
const analyticsQueue = new bullmq_1.Queue('analytics', queueConfig);
cron.schedule('0 9 * * *', async () => {
    log.info('Running daily validation expiry check');
    try {
        await validationExpiryQueue.add('check-expiry', {
            timestamp: new Date(),
        });
    }
    catch (error) {
        log.error('Failed to queue validation expiry check', error);
    }
});
cron.schedule('0 2 * * 0', async () => {
    log.info('Running weekly report cleanup');
    try {
        const oldReports = await prisma.report.findMany({
            where: {
                createdAt: {
                    lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
                status: 'PROCESSED',
            },
            select: {
                id: true,
                filePath: true,
            },
        });
        log.info(`Found ${oldReports.length} old reports to clean up`);
        for (const report of oldReports) {
            await reportCleanupQueue.add('cleanup-report', {
                reportId: report.id,
                filePath: report.filePath,
            });
        }
    }
    catch (error) {
        log.error('Failed to queue report cleanup', error);
    }
});
cron.schedule('0 * * * *', async () => {
    log.info('Running hourly cache cleanup');
    try {
        const patterns = [
            'products:*',
            'validations:*',
            'qr:*',
            'stats:*',
        ];
        for (const pattern of patterns) {
            const keys = await redis_1.cache.keys(pattern);
            for (const key of keys) {
                const ttl = await redis_1.cache.ttl(key);
                if (ttl === -1) {
                    await redis_1.cache.del(key);
                }
            }
        }
        log.info('Cache cleanup completed');
    }
    catch (error) {
        log.error('Failed to clean cache', error);
    }
});
cron.schedule('0 1 * * *', async () => {
    log.info('Running daily analytics aggregation');
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scanStats = await prisma.qRCodeScan.groupBy({
            by: ['qrCodeId'],
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
            _count: true,
        });
        const validationStats = await prisma.validation.groupBy({
            by: ['status', 'laboratoryId'],
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
            _count: true,
        });
        await prisma.analytics.create({
            data: {
                date: yesterday,
                type: 'DAILY',
                data: {
                    scans: scanStats,
                    validations: validationStats,
                },
            },
        });
        log.info('Daily analytics aggregation completed');
    }
    catch (error) {
        log.error('Failed to aggregate analytics', error);
    }
});
cron.schedule('0 3 * * *', async () => {
    log.info('Running database optimization');
    try {
        if (process.env.DATABASE_URL?.includes('postgresql')) {
            await prisma.$executeRaw `ANALYZE;`;
        }
        await prisma.$transaction([
            prisma.notification.deleteMany({
                where: {
                    read: true,
                    createdAt: {
                        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            prisma.auditLog.deleteMany({
                where: {
                    createdAt: {
                        lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        log.info('Database optimization completed');
    }
    catch (error) {
        log.error('Failed to optimize database', error);
    }
});
cron.schedule('*/5 * * * *', async () => {
    try {
        await redis_1.cache.set('health:cron', new Date().toISOString(), 600);
        await prisma.$queryRaw `SELECT 1`;
        log.debug('Health check ping successful');
    }
    catch (error) {
        log.error('Health check failed', error);
    }
});
cron.schedule('0 23 * * *', async () => {
    log.info('Backup reminder: Ensure daily backups are running');
});
log.info('Cron jobs started');
process.on('SIGTERM', () => {
    log.info('SIGTERM received, stopping cron jobs...');
    process.exit(0);
});
if (process.send) {
    process.send('ready');
}
//# sourceMappingURL=cron.js.map