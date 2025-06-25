import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth';
import { ProductService } from '../services/product.service';
import { QRCodeService } from '../services/qrcode.service';
import { AppError } from '../middlewares/errorHandler';
import multer from 'multer';
import { prisma } from '../server';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation middleware
const handleValidation = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

// List products
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'EXPIRED', 'SUSPENDED']),
    query('category').optional().isString(),
    query('search').optional().isString(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as string,
        category: req.query.category as string,
        search: req.query.search as string,
        brandId: req.user?.role === 'BRAND' ? await getBrandId(req.user.userId) : undefined,
      };

      const result = await ProductService.listProducts(filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get product by ID
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const product = await ProductService.getProduct(req.params.id);
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create product
router.post(
  '/',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  upload.single('image'),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('barcode').notEmpty().trim(),
    body('sku').notEmpty().trim(),
    body('category').notEmpty().trim(),
    body('claims').optional().isArray(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const brandId = req.user?.role === 'BRAND' ? await getBrandId(req.user.userId) : req.body.brandId;
      
      if (!brandId) {
        throw new AppError('Brand ID is required', 400);
      }

      const productData = {
        ...req.body,
        brandId,
        image: req.file ? await uploadImage(req.file) : undefined,
      };

      const product = await ProductService.createProduct(productData);
      
      // Generate QR code
      const qrCode = await QRCodeService.generateQRCode(product.id);

      res.status(201).json({
        success: true,
        data: {
          ...product,
          qrCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update product
router.put(
  '/:id',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  upload.single('image'),
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('category').optional().trim(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const updateData = {
        ...req.body,
        image: req.file ? await uploadImage(req.file) : undefined,
      };

      const product = await ProductService.updateProduct(req.params.id, updateData);
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete product
router.delete(
  '/:id',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    param('id').isUUID(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Validate product
router.post(
  '/:id/validate',
  authenticate,
  authorize('BRAND', 'ADMIN', 'LABORATORY'),
  [
    param('id').isUUID(),
    body('laboratoryId').optional().isUUID(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const validation = await ProductService.validateProduct(
        req.params.id,
        req.body.laboratoryId
      );

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add claim to product
router.post(
  '/:id/claims',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    param('id').isUUID(),
    body('type').notEmpty(),
    body('category').notEmpty(),
    body('value').notEmpty(),
    body('unit').optional(),
    body('description').optional(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const claim = await ProductService.addClaim(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add certification to product
router.post(
  '/:id/certifications',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  [
    param('id').isUUID(),
    body('type').notEmpty(),
    body('number').notEmpty(),
    body('issuer').notEmpty(),
    body('issuedAt').isISO8601(),
    body('expiresAt').optional().isISO8601(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const certification = await ProductService.addCertification(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: certification,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions
async function getBrandId(userId: string): Promise<string | undefined> {
  const brand = await prisma.brand.findUnique({
    where: { userId },
  });
  return brand?.id;
}

async function uploadImage(file: Express.Multer.File): Promise<string> {
  // TODO: Implement S3 upload
  // For now, return a placeholder
  return `/uploads/products/${Date.now()}-${file.originalname}`;
}

export default router;