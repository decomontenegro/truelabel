import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth';
import { LaboratoryService } from '../services/laboratory.service';
import { AppError } from '../middlewares/errorHandler';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Register laboratory
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty().trim(),
    body('cnpj').notEmpty().matches(/^\d{14}$/),
    body('accreditation').isArray(),
    body('certifications').isArray(),
    body('specialties').isArray(),
    body('userId').optional().isUUID(),
    body('apiEndpoint').optional().isURL(),
    body('apiKey').optional().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const laboratory = await LaboratoryService.registerLaboratory(req.body);
      
      res.status(201).json({
        success: true,
        data: laboratory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// List laboratories
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const filters = {
        status: req.query.status as any,
        specialties: req.query.specialties ? 
          (Array.isArray(req.query.specialties) ? req.query.specialties : [req.query.specialties]) as string[] : 
          undefined,
      };

      const laboratories = await LaboratoryService.listLaboratories(filters);
      
      res.json({
        success: true,
        data: laboratories,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload laboratory report
router.post(
  '/upload-report',
  authenticate,
  authorize('LABORATORY', 'ADMIN'),
  upload.single('report'),
  [
    body('productId').isUUID(),
    body('reportNumber').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('Report file is required', 400);
      }

      // Get laboratory ID from authenticated user
      let laboratoryId: string;
      if (req.user?.role === 'LABORATORY') {
        const lab = await prisma.laboratory.findUnique({
          where: { userId: req.user.userId },
        });
        if (!lab) {
          throw new AppError('Laboratory not found', 404);
        }
        laboratoryId = lab.id;
      } else {
        laboratoryId = req.body.laboratoryId;
        if (!laboratoryId) {
          throw new AppError('Laboratory ID is required', 400);
        }
      }

      const result = await LaboratoryService.uploadReport({
        laboratoryId,
        productId: req.body.productId,
        reportFile: req.file.buffer,
        reportNumber: req.body.reportNumber,
        mimeType: req.file.mimetype,
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Laboratory webhook endpoint
router.post(
  '/webhook/:laboratoryId',
  [
    param('laboratoryId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      // TODO: Verify webhook signature based on laboratory configuration
      
      await LaboratoryService.handleWebhook(
        req.params.laboratoryId,
        req.body
      );
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get laboratory statistics
router.get(
  '/:id/stats',
  authenticate,
  [
    param('id').isUUID(),
  ],
  async (req, res, next) => {
    try {
      // Check permissions
      if (req.user?.role === 'LABORATORY') {
        const lab = await prisma.laboratory.findUnique({
          where: { userId: req.user.userId },
        });
        if (lab?.id !== req.params.id) {
          throw new AppError('Unauthorized', 403);
        }
      } else if (req.user?.role !== 'ADMIN') {
        throw new AppError('Unauthorized', 403);
      }

      const stats = await LaboratoryService.getLaboratoryStats(req.params.id);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Fetch external results
router.post(
  '/:id/fetch-results',
  authenticate,
  authorize('LABORATORY', 'ADMIN'),
  [
    param('id').isUUID(),
    body('sampleId').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const results = await LaboratoryService.fetchExternalResults(
        req.params.id,
        req.body.sampleId
      );
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;