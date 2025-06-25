import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth';
import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { addReportJob } from '../services/queue';

const router = Router();

// List validations
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
        where.product = { brandId: brand?.id };
      } else if (req.user?.role === 'LABORATORY') {
        const lab = await prisma.laboratory.findUnique({
          where: { userId: req.user.userId },
        });
        where.laboratoryId = lab?.id;
      }

      const validations = await prisma.validation.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          laboratory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: validations,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get validation by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const validation = await prisma.validation.findUnique({
        where: { id: req.params.id },
        include: {
          product: {
            include: {
              brand: true,
              claims: true,
              certifications: true,
              qrCodes: {
                where: { isActive: true },
                take: 1,
              },
            },
          },
          laboratory: true,
          claims: {
            include: {
              claim: true,
            },
          },
          certificates: true,
        },
      });

      if (!validation) {
        throw new AppError('Validation not found', 404);
      }

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate validation report
router.post(
  '/:id/report',
  authenticate,
  [
    param('id').isUUID(),
    query('type').isIn(['full', 'summary', 'certificate']).optional(),
  ],
  async (req, res, next) => {
    try {
      const validation = await prisma.validation.findUnique({
        where: { id: req.params.id },
        include: {
          product: {
            include: {
              brand: true,
            },
          },
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

      // Add report generation job
      const job = await addReportJob({
        validationId: req.params.id,
        type: req.query.type || 'full',
        userId: req.user!.userId,
      });

      res.json({
        success: true,
        message: 'Report generation started',
        data: {
          jobId: job.id,
          validationId: req.params.id,
          type: req.query.type || 'full',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update validation status (admin only)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (!['VALIDATED', 'VALIDATED_WITH_REMARKS', 'REJECTED'].includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      const validation = await prisma.validation.update({
        where: { id: req.params.id },
        data: {
          status,
          validatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;