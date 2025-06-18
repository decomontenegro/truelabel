"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataCleanupJob = void 0;
exports.anonymizeOldScans = anonymizeOldScans;
exports.startDataCleanupJob = startDataCleanupJob;
exports.stopDataCleanupJob = stopDataCleanupJob;
const cron_1 = require("cron");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const privacy_service_1 = require("../services/privacy.service");
exports.dataCleanupJob = new cron_1.CronJob('0 2 * * *', async () => {
    logger_1.logger.info('Starting data cleanup job');
    try {
        await Promise.all([
            cleanupDeletedUsers(),
            cleanupExpiredSessions(),
            cleanupOldLogs(),
            cleanupExpiredConsents(),
            processDataDeletionRequests()
        ]);
        logger_1.logger.info('Data cleanup job completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Data cleanup job failed:', error);
    }
}, null, false, 'America/Sao_Paulo');
async function cleanupDeletedUsers() {
    try {
        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() - 30);
        const usersToDelete = await prisma_1.prisma.user.findMany({
            where: {
                deletedAt: {
                    lt: gracePeriod
                }
            }
        });
        for (const user of usersToDelete) {
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.consent.deleteMany({ where: { userId: user.id } });
                await tx.privacyRequest.deleteMany({ where: { userId: user.id } });
                await tx.apiKey.deleteMany({ where: { userId: user.id } });
                await tx.session.deleteMany({ where: { userId: user.id } });
                await tx.user.delete({ where: { id: user.id } });
                logger_1.logger.info('Permanently deleted user data', { userId: user.id });
            });
        }
        if (usersToDelete.length > 0) {
            logger_1.logger.info(`Cleaned up ${usersToDelete.length} deleted users`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up deleted users:', error);
    }
}
async function cleanupExpiredSessions() {
    try {
        const result = await prisma_1.prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        if (result.count > 0) {
            logger_1.logger.info(`Cleaned up ${result.count} expired sessions`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up sessions:', error);
    }
}
async function cleanupOldLogs() {
    try {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - 90);
        const auditResult = await prisma_1.prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: retentionDate
                }
            }
        });
        const securityResult = await prisma_1.prisma.securityLog.deleteMany({
            where: {
                createdAt: {
                    lt: retentionDate
                }
            }
        });
        const privacyRetentionDate = new Date();
        privacyRetentionDate.setFullYear(privacyRetentionDate.getFullYear() - 1);
        const privacyResult = await prisma_1.prisma.privacyLog.deleteMany({
            where: {
                createdAt: {
                    lt: privacyRetentionDate
                }
            }
        });
        logger_1.logger.info('Cleaned up old logs', {
            audit: auditResult.count,
            security: securityResult.count,
            privacy: privacyResult.count
        });
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up logs:', error);
    }
}
async function cleanupExpiredConsents() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const expiredConsents = await prisma_1.prisma.consent.findMany({
            where: {
                updatedAt: {
                    lt: oneYearAgo
                }
            },
            include: {
                user: true
            }
        });
        for (const consent of expiredConsents) {
            await prisma_1.prisma.privacyLog.create({
                data: {
                    action: 'CONSENT_EXPIRED',
                    userId: consent.userId,
                    performedBy: 'SYSTEM',
                    details: {
                        consentType: consent.type,
                        expiredAt: new Date()
                    }
                }
            });
        }
        if (expiredConsents.length > 0) {
            logger_1.logger.info(`Found ${expiredConsents.length} expired consents requiring renewal`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error processing expired consents:', error);
    }
}
async function processDataDeletionRequests() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const pendingRequests = await prisma_1.prisma.privacyRequest.findMany({
            where: {
                type: 'DELETION',
                status: 'PENDING',
                createdAt: {
                    lt: yesterday
                }
            }
        });
        for (const request of pendingRequests) {
            try {
                await prisma_1.prisma.privacyRequest.update({
                    where: { id: request.id },
                    data: { status: 'IN_PROGRESS' }
                });
                await privacy_service_1.PrivacyService.deleteUserData(request.userId, request.reason || 'Automated processing');
                logger_1.logger.info('Processed data deletion request', {
                    requestId: request.id,
                    userId: request.userId
                });
            }
            catch (error) {
                logger_1.logger.error('Error processing deletion request:', error);
                await prisma_1.prisma.privacyRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'REJECTED',
                        notes: 'Failed to process: ' + error.message
                    }
                });
            }
        }
        if (pendingRequests.length > 0) {
            logger_1.logger.info(`Processed ${pendingRequests.length} data deletion requests`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error processing deletion requests:', error);
    }
}
async function anonymizeOldScans() {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const oldScans = await prisma_1.prisma.qRCodeScan.findMany({
            where: {
                createdAt: {
                    lt: sixMonthsAgo
                }
            },
            select: {
                id: true,
                qrCodeId: true,
                createdAt: true
            }
        });
        const aggregated = new Map();
        for (const scan of oldScans) {
            const dateKey = scan.createdAt.toISOString().split('T')[0];
            const key = `${scan.qrCodeId}-${dateKey}`;
            aggregated.set(key, (aggregated.get(key) || 0) + 1);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.qRCodeScan.deleteMany({
                where: {
                    id: {
                        in: oldScans.map(s => s.id)
                    }
                }
            });
        });
        if (oldScans.length > 0) {
            logger_1.logger.info(`Anonymized ${oldScans.length} old QR scan records`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error anonymizing old scans:', error);
    }
}
function startDataCleanupJob() {
    exports.dataCleanupJob.start();
    logger_1.logger.info('Data cleanup job scheduled');
}
function stopDataCleanupJob() {
    exports.dataCleanupJob.stop();
    logger_1.logger.info('Data cleanup job stopped');
}
//# sourceMappingURL=data-cleanup.job.js.map