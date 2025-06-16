import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middlewares/auth';
import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { PDFService } from '../services/pdf.service';
import { getQueueStats } from '../services/queue';

const router = Router();

// Get report generation status
router.get(
  '/status/:jobId',
  authenticate,
  [
    param('jobId').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      // TODO: Implement job status tracking
      const stats = await getQueueStats();
      
      res.json({
        success: true,
        data: {
          jobId: req.params.jobId,
          status: 'processing',
          queueStats: stats.report,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Download report
router.get(
  '/download/:validationId/:type',
  authenticate,
  [
    param('validationId').isUUID(),
    param('type').isIn(['full', 'summary', 'certificate']),
  ],
  async (req, res, next) => {
    try {
      const validation = await prisma.validation.findUnique({
        where: { id: req.params.validationId },
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
        throw new AppError('Validation not found', 404);
      }

      // Check permissions
      if (req.user?.role === 'BRAND') {
        const brand = await prisma.brand.findUnique({
          where: { userId: req.user.userId },
        });
        if (validation.product.brandId !== brand?.id) {
          throw new AppError('Unauthorized', 403);
        }
      }

      let pdfBuffer: Buffer;
      let filename: string;

      switch (req.params.type) {
        case 'full':
          pdfBuffer = await PDFService.generateFullReport(validation);
          filename = `relatorio-completo-${validation.product.name}-${validation.id}.pdf`;
          break;
        case 'summary':
          pdfBuffer = await PDFService.generateSummaryReport(validation);
          filename = `resumo-${validation.product.name}-${validation.id}.pdf`;
          break;
        case 'certificate':
          pdfBuffer = await PDFService.generateCertificate(validation);
          filename = `certificado-${validation.product.name}-${validation.id}.pdf`;
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

// List available reports
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const where: any = {};
      
      if (req.user?.role === 'BRAND') {
        const brand = await prisma.brand.findUnique({
          where: { userId: req.user.userId },
        });
        where.userId = req.user.userId;
        where.metadata = {
          path: ['brandId'],
          equals: brand?.id,
        };
      } else {
        where.userId = req.user?.userId;
      }

      const reports = await prisma.activityLog.findMany({
        where: {
          ...where,
          action: 'REPORT_GENERATED',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json({
        success: true,
        data: reports.map(r => ({
          id: r.id,
          validationId: r.entityId,
          type: r.metadata?.type,
          filename: r.metadata?.filename,
          reportUrl: r.metadata?.reportUrl,
          createdAt: r.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;