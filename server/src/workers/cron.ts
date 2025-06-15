import * as cron from 'node-cron';
import { Queue } from 'bullmq';
import { createModuleLogger } from '../utils/logger';
import { getPrismaClient } from '../lib/prisma';
import { cache } from '../lib/redis';

const log = createModuleLogger('CronJobs');
const prisma = getPrismaClient();

// Queue connections
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};

const validationExpiryQueue = new Queue('validation-expiry', queueConfig);
const reportCleanupQueue = new Queue('report-cleanup', queueConfig);
const analyticsQueue = new Queue('analytics', queueConfig);

// Daily validation expiry check - runs at 9 AM
cron.schedule('0 9 * * *', async () => {
  log.info('Running daily validation expiry check');
  
  try {
    await validationExpiryQueue.add('check-expiry', {
      timestamp: new Date(),
    });
  } catch (error) {
    log.error('Failed to queue validation expiry check', error as Error);
  }
});

// Weekly report cleanup - runs every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  log.info('Running weekly report cleanup');
  
  try {
    // Find old reports (older than 90 days)
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
    
    // Queue cleanup for each report
    for (const report of oldReports) {
      await reportCleanupQueue.add('cleanup-report', {
        reportId: report.id,
        filePath: report.filePath,
      });
    }
  } catch (error) {
    log.error('Failed to queue report cleanup', error as Error);
  }
});

// Hourly cache cleanup - runs every hour
cron.schedule('0 * * * *', async () => {
  log.info('Running hourly cache cleanup');
  
  try {
    // Clear expired cache entries
    const patterns = [
      'products:*',
      'validations:*',
      'qr:*',
      'stats:*',
    ];
    
    for (const pattern of patterns) {
      const keys = await cache.keys(pattern);
      
      for (const key of keys) {
        const ttl = await cache.ttl(key);
        if (ttl === -1) { // No expiry set
          await cache.del(key);
        }
      }
    }
    
    log.info('Cache cleanup completed');
  } catch (error) {
    log.error('Failed to clean cache', error as Error);
  }
});

// Daily analytics aggregation - runs at 1 AM
cron.schedule('0 1 * * *', async () => {
  log.info('Running daily analytics aggregation');
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Aggregate QR code scans
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
    
    // Aggregate validation stats
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
    
    // Save daily analytics
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
  } catch (error) {
    log.error('Failed to aggregate analytics', error as Error);
  }
});

// Database optimization - runs daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  log.info('Running database optimization');
  
  try {
    // Analyze tables for query optimization (PostgreSQL)
    if (process.env.DATABASE_URL?.includes('postgresql')) {
      await prisma.$executeRaw`ANALYZE;`;
    }
    
    // Clean up orphaned records
    await prisma.$transaction([
      // Delete notifications older than 30 days and read
      prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Delete audit logs older than 1 year
      prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);
    
    log.info('Database optimization completed');
  } catch (error) {
    log.error('Failed to optimize database', error as Error);
  }
});

// Health check ping - runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    // Update health check timestamp
    await cache.set('health:cron', new Date().toISOString(), 600);
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    log.debug('Health check ping successful');
  } catch (error) {
    log.error('Health check failed', error as Error);
  }
});

// Backup reminder - runs daily at 11 PM
cron.schedule('0 23 * * *', async () => {
  log.info('Backup reminder: Ensure daily backups are running');
  
  // This is just a reminder log. Actual backups should be handled
  // by system-level scripts or cloud provider tools
});

// Start cron jobs
log.info('Cron jobs started');

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, stopping cron jobs...');
  process.exit(0);
});

// Signal PM2 that we're ready
if (process.send) {
  process.send('ready');
}