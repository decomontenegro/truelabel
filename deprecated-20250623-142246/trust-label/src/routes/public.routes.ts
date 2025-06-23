import { Router } from 'express';
import { param } from 'express-validator';
import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { QRCodeService } from '../services/qrcode.service';
import { optionalAuth } from '../middlewares/auth';

const router = Router();

// Public product validation page
router.get(
  '/product/:productId',
  [
    param('productId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
        include: {
          brand: {
            select: {
              name: true,
              logo: true,
              website: true,
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
          certifications: {
            where: {
              verified: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          },
          qrCodes: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      const validation = product.validations[0];
      if (!validation) {
        throw new AppError('No valid validation found for this product', 404);
      }

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            images: product.images,
            ean: product.barcode,
          },
          brand: product.brand,
          validation: {
            id: validation.id,
            status: validation.status,
            validatedAt: validation.validatedAt,
            validUntil: validation.validUntil,
            laboratory: validation.laboratory,
            aiAnalysis: validation.aiAnalysis,
            categories: validation.categories,
            summary: validation.summary,
          },
          certifications: product.certifications.map(cert => ({
            type: cert.type,
            issuer: cert.issuer,
            issuedAt: cert.issuedAt,
            expiresAt: cert.expiresAt,
          })),
          qrCode: product.qrCodes[0] ? {
            code: product.qrCodes[0].code,
            url: product.qrCodes[0].shortUrl,
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// QR Code redirect endpoint
router.get(
  '/v/:code',
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
          product: true,
        },
      });

      if (!qrCode) {
        throw new AppError('Invalid QR code', 404);
      }

      // Track scan
      await QRCodeService.trackScan(req.params.code, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || req.headers['referrer'],
      });

      // Redirect to product validation page
      res.redirect(`/public/product/${qrCode.productId}`);
    } catch (error) {
      next(error);
    }
  }
);

// Product search
router.get(
  '/search',
  [
    query('q').optional().isString(),
    query('ean').optional().isString(),
    query('category').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const { q, ean, category } = req.query;
      const where: any = {
        status: 'VALIDATED',
      };

      if (ean) {
        where.barcode = ean;
      } else if (q) {
        where.OR = [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          images: true,
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
            select: {
              id: true,
              status: true,
              validatedAt: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: products.filter(p => p.validations.length > 0),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Categories list
router.get(
  '/categories',
  async (req, res, next) => {
    try {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        where: {
          status: 'VALIDATED',
        },
        _count: true,
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
      });

      res.json({
        success: true,
        data: categories.map(cat => ({
          name: cat.category,
          count: cat._count,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Recent validations
router.get(
  '/recent',
  async (req, res, next) => {
    try {
      const validations = await prisma.validation.findMany({
        where: {
          status: {
            in: ['VALIDATED', 'VALIDATED_WITH_REMARKS'],
          },
          validUntil: {
            gt: new Date(),
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true,
              brand: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: { validatedAt: 'desc' },
      });

      res.json({
        success: true,
        data: validations.map(v => ({
          product: v.product,
          validatedAt: v.validatedAt,
          status: v.status,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;