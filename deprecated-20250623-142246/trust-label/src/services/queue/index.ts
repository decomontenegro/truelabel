import Bull from 'bull';
import { logger } from '../../utils/logger';
import { validationProcessor } from './processors/validation.processor';
import { emailProcessor } from './processors/email.processor';
import { reportProcessor } from './processors/report.processor';
import { aiAnalysisProcessor } from './processors/ai-analysis.processor';

// Create queues
export const validationQueue = new Bull('validation', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const emailQueue = new Bull('email', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const reportQueue = new Bull('report', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const aiAnalysisQueue = new Bull('ai-analysis', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Queue options
const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: false,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

// Initialize processors
export async function startQueues() {
  try {
    // Process validation jobs
    validationQueue.process(5, validationProcessor);
    
    // Process email jobs
    emailQueue.process(10, emailProcessor);
    
    // Process report generation jobs
    reportQueue.process(3, reportProcessor);
    
    // Process AI analysis jobs
    aiAnalysisQueue.process(5, aiAnalysisProcessor);

    // Queue event handlers
    const queues = [validationQueue, emailQueue, reportQueue, aiAnalysisQueue];
    
    queues.forEach((queue) => {
      queue.on('completed', (job) => {
        logger.info(`Job ${job.id} completed in queue ${queue.name}`);
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed in queue ${queue.name}:`, err);
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled in queue ${queue.name}`);
      });
    });

    logger.info('Background queues started successfully');
  } catch (error) {
    logger.error('Failed to start queues:', error);
    throw error;
  }
}

// Export job creation functions
export async function addValidationJob(data: any) {
  return validationQueue.add(data, defaultJobOptions);
}

export async function addEmailJob(data: any) {
  return emailQueue.add(data, {
    ...defaultJobOptions,
    attempts: 5,
  });
}

export async function addReportJob(data: any) {
  return reportQueue.add(data, {
    ...defaultJobOptions,
    priority: data.priority || 0,
  });
}

export async function addAIAnalysisJob(data: any) {
  return aiAnalysisQueue.add(data, {
    ...defaultJobOptions,
    timeout: 300000, // 5 minutes
  });
}

// Queue monitoring
export async function getQueueStats() {
  const stats = await Promise.all([
    validationQueue.getJobCounts(),
    emailQueue.getJobCounts(),
    reportQueue.getJobCounts(),
    aiAnalysisQueue.getJobCounts(),
  ]);

  return {
    validation: stats[0],
    email: stats[1],
    report: stats[2],
    aiAnalysis: stats[3],
  };
}

// Clean old jobs
export async function cleanQueues() {
  const grace = 1000 * 60 * 60 * 24 * 7; // 7 days
  
  await Promise.all([
    validationQueue.clean(grace),
    emailQueue.clean(grace),
    reportQueue.clean(grace),
    aiAnalysisQueue.clean(grace),
  ]);
  
  logger.info('Queues cleaned');
}