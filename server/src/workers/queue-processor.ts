import { Queue, Worker, Job } from 'bullmq';
import { createModuleLogger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { reportParserService } from '../services/reportParserService';
import { getPrismaClient } from '../lib/prisma';
import { websocketService } from '../services/websocketService';

const log = createModuleLogger('QueueProcessor');
const prisma = getPrismaClient();

// Queue configuration
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};

// Email queue processor
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    const { to, subject, template, data } = job.data;
    
    log.info('Processing email job', { jobId: job.id, to, subject });
    
    try {
      await emailService.sendTemplateEmail(to, subject, template, data);
      log.info('Email sent successfully', { jobId: job.id });
    } catch (error) {
      log.error('Failed to send email', error as Error, { jobId: job.id });
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: 5,
  }
);

// Report processing queue
const reportWorker = new Worker(
  'report-processing',
  async (job: Job) => {
    const { reportId, filePath } = job.data;
    
    log.info('Processing report', { jobId: job.id, reportId });
    
    try {
      // Parse report
      const results = await reportParserService.parseReport(filePath);
      
      // Update report in database
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'PROCESSED',
          results: JSON.stringify(results),
          processedAt: new Date(),
        },
      });
      
      // Notify user via websocket
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
        websocketService.sendToUser(report.product.user.id, 'report_processed', {
          reportId,
          productId: report.productId,
          status: 'completed',
        });
      }
      
      log.info('Report processed successfully', { jobId: job.id, reportId });
    } catch (error) {
      log.error('Failed to process report', error as Error, { jobId: job.id, reportId });
      
      // Update report status to failed
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
        },
      });
      
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: 3,
  }
);

// Notification queue
const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    const { userId, type, title, message, data } = job.data;
    
    log.info('Processing notification', { jobId: job.id, userId, type });
    
    try {
      // Save notification to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
        },
      });
      
      // Send real-time notification via websocket
      websocketService.sendToUser(userId, 'notification', {
        id: notification.id,
        type,
        title,
        message,
        createdAt: notification.createdAt,
      });
      
      // Send email notification if enabled
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailNotifications: true },
      });
      
      if (user?.emailNotifications) {
        await emailService.sendNotificationEmail(user.email, {
          type,
          title,
          message,
        });
      }
      
      log.info('Notification sent successfully', { jobId: job.id, notificationId: notification.id });
    } catch (error) {
      log.error('Failed to send notification', error as Error, { jobId: job.id });
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: 10,
  }
);

// Validation expiry check queue
const validationExpiryWorker = new Worker(
  'validation-expiry',
  async (job: Job) => {
    log.info('Checking for expired validations');
    
    try {
      // Find validations expiring in the next 30 days
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
      
      // Send notifications for each expiring validation
      for (const validation of expiringValidations) {
        const daysUntilExpiry = Math.ceil(
          (validation.validUntil!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        
        // Notify brand users
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
        
        // Mark as notified
        await prisma.validation.update({
          where: { id: validation.id },
          data: { expiryNotificationSent: true },
        });
      }
      
      log.info('Validation expiry check completed', { 
        validationsFound: expiringValidations.length 
      });
    } catch (error) {
      log.error('Failed to check validation expiry', error as Error);
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: 1,
  }
);

// Worker event handlers
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

// Graceful shutdown
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

// Signal PM2 that we're ready
if (process.send) {
  process.send('ready');
}