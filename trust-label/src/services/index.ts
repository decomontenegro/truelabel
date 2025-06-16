import { logger } from '../utils/logger';
import { cleanQueues } from './queue';
import { prisma } from '../server';

export async function initializeServices() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection verified');

    // Clean old queue jobs
    await cleanQueues();
    logger.info('Queue cleanup completed');

    // Initialize any other services here
    // For example: cache warming, external API connections, etc.

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw error;
  }
}

// Export all services
export * from './auth.service';
export * from './email.service';
export * from './ai.service';
export * from './qrcode.service';
export * from './pdf.service';