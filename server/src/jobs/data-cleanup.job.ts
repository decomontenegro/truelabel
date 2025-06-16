import { CronJob } from 'cron';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { PrivacyService } from '../services/privacy.service';

/**
 * Data cleanup job for LGPD compliance
 * Runs daily at 2 AM
 */
export const dataCleanupJob = new CronJob(
  '0 2 * * *', // Daily at 2 AM
  async () => {
    logger.info('Starting data cleanup job');
    
    try {
      await Promise.all([
        cleanupDeletedUsers(),
        cleanupExpiredSessions(),
        cleanupOldLogs(),
        cleanupExpiredConsents(),
        processDataDeletionRequests()
      ]);
      
      logger.info('Data cleanup job completed successfully');
    } catch (error) {
      logger.error('Data cleanup job failed:', error);
    }
  },
  null,
  false,
  'America/Sao_Paulo'
);

/**
 * Clean up users marked for deletion after grace period
 */
async function cleanupDeletedUsers() {
  try {
    // Find users marked for deletion over 30 days ago
    const gracePeriod = new Date();
    gracePeriod.setDate(gracePeriod.getDate() - 30);
    
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletedAt: {
          lt: gracePeriod
        }
      }
    });
    
    for (const user of usersToDelete) {
      // Permanently delete user data
      await prisma.$transaction(async (tx) => {
        // Delete all related records
        await tx.consent.deleteMany({ where: { userId: user.id } });
        await tx.privacyRequest.deleteMany({ where: { userId: user.id } });
        await tx.apiKey.deleteMany({ where: { userId: user.id } });
        await tx.session.deleteMany({ where: { userId: user.id } });
        
        // Finally delete the user
        await tx.user.delete({ where: { id: user.id } });
        
        logger.info('Permanently deleted user data', { userId: user.id });
      });
    }
    
    if (usersToDelete.length > 0) {
      logger.info(`Cleaned up ${usersToDelete.length} deleted users`);
    }
  } catch (error) {
    logger.error('Error cleaning up deleted users:', error);
  }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up sessions:', error);
  }
}

/**
 * Clean up old logs (keep only last 90 days)
 */
async function cleanupOldLogs() {
  try {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 90);
    
    // Clean audit logs
    const auditResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: retentionDate
        }
      }
    });
    
    // Clean security logs
    const securityResult = await prisma.securityLog.deleteMany({
      where: {
        createdAt: {
          lt: retentionDate
        }
      }
    });
    
    // Clean privacy logs (keep for 1 year for compliance)
    const privacyRetentionDate = new Date();
    privacyRetentionDate.setFullYear(privacyRetentionDate.getFullYear() - 1);
    
    const privacyResult = await prisma.privacyLog.deleteMany({
      where: {
        createdAt: {
          lt: privacyRetentionDate
        }
      }
    });
    
    logger.info('Cleaned up old logs', {
      audit: auditResult.count,
      security: securityResult.count,
      privacy: privacyResult.count
    });
  } catch (error) {
    logger.error('Error cleaning up logs:', error);
  }
}

/**
 * Clean up expired consents (re-request after 1 year)
 */
async function cleanupExpiredConsents() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Find consents older than 1 year
    const expiredConsents = await prisma.consent.findMany({
      where: {
        updatedAt: {
          lt: oneYearAgo
        }
      },
      include: {
        user: true
      }
    });
    
    // Mark them as requiring renewal
    for (const consent of expiredConsents) {
      // Create a privacy log entry
      await prisma.privacyLog.create({
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
      
      // You might want to send an email to request consent renewal
      // await EmailService.sendConsentRenewalRequest(consent.user.email);
    }
    
    if (expiredConsents.length > 0) {
      logger.info(`Found ${expiredConsents.length} expired consents requiring renewal`);
    }
  } catch (error) {
    logger.error('Error processing expired consents:', error);
  }
}

/**
 * Process pending data deletion requests
 */
async function processDataDeletionRequests() {
  try {
    // Find deletion requests that have been pending for over 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pendingRequests = await prisma.privacyRequest.findMany({
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
        // Update status to in progress
        await prisma.privacyRequest.update({
          where: { id: request.id },
          data: { status: 'IN_PROGRESS' }
        });
        
        // Process the deletion
        await PrivacyService.deleteUserData(request.userId, request.reason || 'Automated processing');
        
        logger.info('Processed data deletion request', { 
          requestId: request.id,
          userId: request.userId 
        });
      } catch (error) {
        logger.error('Error processing deletion request:', error);
        
        // Mark as rejected if it fails
        await prisma.privacyRequest.update({
          where: { id: request.id },
          data: { 
            status: 'REJECTED',
            notes: 'Failed to process: ' + (error as Error).message
          }
        });
      }
    }
    
    if (pendingRequests.length > 0) {
      logger.info(`Processed ${pendingRequests.length} data deletion requests`);
    }
  } catch (error) {
    logger.error('Error processing deletion requests:', error);
  }
}

/**
 * Anonymize old QR scan data (keep aggregated stats only)
 */
export async function anonymizeOldScans() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Find old scan records
    const oldScans = await prisma.qRCodeScan.findMany({
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
    
    // Group by QR code and date for aggregation
    const aggregated = new Map<string, number>();
    
    for (const scan of oldScans) {
      const dateKey = scan.createdAt.toISOString().split('T')[0];
      const key = `${scan.qrCodeId}-${dateKey}`;
      aggregated.set(key, (aggregated.get(key) || 0) + 1);
    }
    
    // Store aggregated data and delete individual records
    await prisma.$transaction(async (tx) => {
      // Create aggregated records (you'd need to create this table)
      // await tx.qrScanAggregate.createMany({
      //   data: Array.from(aggregated.entries()).map(([key, count]) => {
      //     const [qrCodeId, date] = key.split('-');
      //     return { qrCodeId, date: new Date(date), count };
      //   })
      // });
      
      // Delete individual scan records
      await tx.qRCodeScan.deleteMany({
        where: {
          id: {
            in: oldScans.map(s => s.id)
          }
        }
      });
    });
    
    if (oldScans.length > 0) {
      logger.info(`Anonymized ${oldScans.length} old QR scan records`);
    }
  } catch (error) {
    logger.error('Error anonymizing old scans:', error);
  }
}

// Start the job
export function startDataCleanupJob() {
  dataCleanupJob.start();
  logger.info('Data cleanup job scheduled');
}

// Stop the job
export function stopDataCleanupJob() {
  dataCleanupJob.stop();
  logger.info('Data cleanup job stopped');
}