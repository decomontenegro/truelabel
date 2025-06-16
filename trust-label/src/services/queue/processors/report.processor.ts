import { Job } from 'bull';
import { prisma } from '../../../server';
import { PDFService } from '../../pdf.service';
import { logger } from '../../../utils/logger';
import { io } from '../../../server';

export async function reportProcessor(job: Job) {
  const { validationId, type, userId } = job.data;

  try {
    logger.info(`Generating ${type} report for validation ${validationId}`);

    // Get validation data
    const validation = await prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        product: {
          include: {
            brand: true,
            claims: true,
            qrCodes: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
        laboratory: true,
        claims: {
          include: { claim: true },
        },
        certificates: true,
      },
    });

    if (!validation) {
      throw new Error('Validation not found');
    }

    // Generate PDF based on type
    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'full':
        pdfBuffer = await PDFService.generateFullReport(validation);
        filename = `relatorio-completo-${validation.product.name}-${Date.now()}.pdf`;
        break;
      case 'summary':
        pdfBuffer = await PDFService.generateSummaryReport(validation);
        filename = `resumo-${validation.product.name}-${Date.now()}.pdf`;
        break;
      case 'certificate':
        pdfBuffer = await PDFService.generateCertificate(validation);
        filename = `certificado-${validation.product.name}-${Date.now()}.pdf`;
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    // Upload to S3 or save locally
    const reportUrl = await PDFService.saveReport(pdfBuffer, filename);

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'REPORT_GENERATED',
        entity: 'VALIDATION',
        entityId: validationId,
        metadata: {
          type,
          filename,
          reportUrl,
        },
      },
    });

    // Emit completion event
    io.to(`user-${userId}`).emit('report-ready', {
      validationId,
      type,
      reportUrl,
      filename,
    });

    logger.info(`Report generated: ${filename}`);

    return {
      validationId,
      type,
      reportUrl,
      filename,
    };
  } catch (error) {
    logger.error(`Report generation failed for validation ${validationId}:`, error);

    // Emit error event
    io.to(`user-${userId}`).emit('report-error', {
      validationId,
      type,
      error: 'Report generation failed',
    });

    throw error;
  }
}