import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth';
import { QRCodeService } from '../services/qrcode.service';
import { AppError } from '../middlewares/errorHandler';
import { qrScanRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Generate QR code for product
router.post(
  '/generate',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    body('productId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const qrCode = await QRCodeService.generateQRCode(req.body.productId);
      
      res.json({
        success: true,
        data: qrCode,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get QR code info (public endpoint)
router.get(
  '/:code',
  [
    param('code').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const qrCode = await prisma.qRCode.findFirst({
        where: { 
          code: req.params.code,
          isActive: true,
        },
        include: {
          product: {
            include: {
              brand: {
                select: {
                  name: true,
                  logo: true,
                },
              },
              validations: {
                where: {
                  status: {
                    in: ['VALIDATED', 'VALIDATED_WITH_REMARKS'],
                  },
                  validUntil: {
                    gt: new Date(),
                  },
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  laboratory: {
                    select: {
                      name: true,
                      accreditation: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!qrCode) {
        throw new AppError('QR code not found', 404);
      }

      res.json({
        success: true,
        data: {
          product: {
            id: qrCode.product.id,
            name: qrCode.product.name,
            description: qrCode.product.description,
            category: qrCode.product.category,
            images: qrCode.product.images,
            brand: qrCode.product.brand,
          },
          validation: qrCode.product.validations[0] || null,
          qrCode: {
            code: qrCode.code,
            scans: qrCode.scans,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Track QR code scan (public endpoint)
router.post(
  '/:code/scan',
  qrScanRateLimiter,
  [
    param('code').notEmpty(),
    body('location').optional().isObject(),
  ],
  async (req, res, next) => {
    try {
      const scanData = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || req.headers['referrer'],
        location: req.body.location,
      };

      await QRCodeService.trackScan(req.params.code, scanData);

      res.json({
        success: true,
        message: 'Scan tracked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get QR code analytics
router.get(
  '/:productId/analytics',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    param('productId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const timeRange = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const analytics = await QRCodeService.getQRCodeAnalytics(
        req.params.productId,
        timeRange.startDate && timeRange.endDate ? timeRange : undefined
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Regenerate QR code
router.post(
  '/:productId/regenerate',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    param('productId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const qrCode = await QRCodeService.regenerateQRCode(req.params.productId);
      
      res.json({
        success: true,
        data: qrCode,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Deactivate QR code
router.delete(
  '/:code',
  authenticate,
  authorize('ADMIN'),
  [
    param('code').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      await QRCodeService.deactivateQRCode(req.params.code);
      
      res.json({
        success: true,
        message: 'QR code deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;