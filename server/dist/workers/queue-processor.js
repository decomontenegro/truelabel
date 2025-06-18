"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const logger_1 = require("../utils/logger");
const emailService_1 = require("../services/emailService");
const reportParserService_1 = require("../services/reportParserService");
const prisma_1 = require("../lib/prisma");
const websocketService_1 = require("../services/websocketService");
const log = (0, logger_1.createModuleLogger)('QueueProcessor');
const prisma = (0, prisma_1.getPrismaClient)();
const queueConfig = {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    },
};
const emailWorker = new bullmq_1.Worker('email', async (job) => {
    const { to, subject, template, data } = job.data;
    log.info('Processing email job', { jobId: job.id, to, subject });
    try {
        await emailService_1.emailService.sendTemplateEmail(to, subject, template, data);
        log.info('Email sent successfully', { jobId: job.id });
    }
    catch (error) {
        log.error('Failed to send email', error, { jobId: job.id });
        throw error;
    }
}, {
    ...queueConfig,
    concurrency: 5,
});
const reportWorker = new bullmq_1.Worker('report-processing', async (job) => {
    const { reportId, filePath } = job.data;
    log.info('Processing report', { jobId: job.id, reportId });
    try {
        const results = await reportParserService_1.reportParserService.parseReport(filePath);
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: 'PROCESSED',
                results: JSON.stringify(results),
                processedAt: new Date(),
            },
        });
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                product: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (report?.product.user) {
            websocketService_1.websocketService.sendToUser(report.product.user.id, 'report_processed', {
                reportId,
                productId: report.productId,
                status: 'completed',
            });
        }
        log.info('Report processed successfully', { jobId: job.id, reportId });
    }
    catch (error) {
        log.error('Failed to process report', error, { jobId: job.id, reportId });
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: 'FAILED',
                error: error.message,
            },
        });
        throw error;
    }
}, {
    ...queueConfig,
    concurrency: 3,
});
const notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
    const { userId, type, title, message, data } = job.data;
    log.info('Processing notification', { jobId: job.id, userId, type });
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data,
            },
        });
        websocketService_1.websocketService.sendToUser(userId, 'notification', {
            id: notification.id,
            type,
            title,
            message,
            createdAt: notification.createdAt,
        });
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, emailNotifications: true },
        });
        if (user?.emailNotifications) {
            await emailService_1.emailService.sendNotificationEmail(user.email, {
                type,
                title,
                message,
            });
        }
        log.info('Notification sent successfully', { jobId: job.id, notificationId: notification.id });
    }
    catch (error) {
        log.error('Failed to send notification', error, { jobId: job.id });
        throw error;
    }
}, {
    ...queueConfig,
    concurrency: 10,
});
const validationExpiryWorker = new bullmq_1.Worker('validation-expiry', async (job) => {
    log.info('Checking for expired validations');
    try {
        const expiringValidations = await prisma.validation.findMany({
            where: {
                status: 'VALIDATED',
                validUntil: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                expiryNotificationSent: false,
            },
            include: {
                product: {
                    include: {
                        brand: {
                            include: {
                                users: true,
                            },
                        },
                    },
                },
            },
        });
        for (const validation of expiringValidations) {
            const daysUntilExpiry = Math.ceil((validation.validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            for (const user of validation.product.brand.users) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'VALIDATION_EXPIRING',
                        title: 'Validação Expirando',
                        message: `A validação do produto ${validation.product.name} expira em ${daysUntilExpiry} dias`,
                        data: {
                            validationId: validation.id,
                            productId: validation.productId,
                            daysUntilExpiry,
                        },
                    },
                });
            }
            await prisma.validation.update({
                where: { id: validation.id },
                data: { expiryNotificationSent: true },
            });
        }
        log.info('Validation expiry check completed', {
            validationsFound: expiringValidations.length
        });
    }
    catch (error) {
        log.error('Failed to check validation expiry', error);
        throw error;
    }
}, {
    ...queueConfig,
    concurrency: 1,
});
[emailWorker, reportWorker, notificationWorker, validationExpiryWorker].forEach(worker => {
    worker.on('completed', job => {
        log.debug(`Job ${job.id} completed in queue ${job.queueName}`);
    });
    worker.on('failed', (job, err) => {
        log.error(`Job ${job?.id} failed in queue ${job?.queueName}`, err);
    });
    worker.on('error', err => {
        log.error('Worker error', err);
    });
});
process.on('SIGTERM', async () => {
    log.info('SIGTERM received, closing workers...');
    await Promise.all([
        emailWorker.close(),
        reportWorker.close(),
        notificationWorker.close(),
        validationExpiryWorker.close(),
    ]);
    await prisma.$disconnect();
    process.exit(0);
});
log.info('Queue processor started');
if (process.send) {
    process.send('ready');
}
//# sourceMappingURL=queue-processor.js.map