import { Job } from 'bull';
import { prisma } from '../../../server';
import { AIService } from '../../ai.service';
import { logger } from '../../../utils/logger';

export async function aiAnalysisProcessor(job: Job) {
  const { type, data } = job.data;

  try {
    logger.info(`Processing AI analysis job: ${type}`);

    let result: any;

    switch (type) {
      case 'CLAIM_EXTRACTION':
        result = await AIService.analyzeProductClaims(data);
        break;

      case 'REPORT_PARSING':
        result = await AIService.parseLabReport(data.buffer, data.mimeType);
        break;

      case 'ANOMALY_DETECTION':
        result = await AIService.detectAnomalies(data);
        break;

      case 'PRODUCT_DESCRIPTION':
        result = await AIService.generateProductDescription(data);
        break;

      default:
        throw new Error(`Unknown AI analysis type: ${type}`);
    }

    // Save job result
    await prisma.aIAnalysisJob.create({
      data: {
        type,
        status: 'COMPLETED',
        input: data,
        output: result,
        completedAt: new Date(),
      },
    });

    logger.info(`AI analysis completed: ${type}`);

    return result;
  } catch (error) {
    logger.error(`AI analysis failed for type ${type}:`, error);

    // Save failed job
    await prisma.aIAnalysisJob.create({
      data: {
        type,
        status: 'FAILED',
        input: data,
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}