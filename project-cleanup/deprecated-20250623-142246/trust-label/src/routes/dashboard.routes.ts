import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth';
import { DashboardService } from '../services/dashboard.service';
import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

// Admin dashboard
router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const dashboard = await DashboardService.getAdminDashboard();
      
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Brand dashboard
router.get(
  '/brand',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  async (req, res, next) => {
    try {
      let brandId: string;
      
      if (req.user?.role === 'BRAND') {
        const brand = await prisma.brand.findUnique({
          where: { userId: req.user.userId },
        });
        if (!brand) {
          throw new AppError('Brand not found', 404);
        }
        brandId = brand.id;
      } else {
        brandId = req.query.brandId as string;
        if (!brandId) {
          throw new AppError('Brand ID is required', 400);
        }
      }

      const dashboard = await DashboardService.getBrandDashboard(brandId);
      
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Laboratory dashboard
router.get(
  '/laboratory',
  authenticate,
  authorize('LABORATORY', 'ADMIN'),
  async (req, res, next) => {
    try {
      let laboratoryId: string;
      
      if (req.user?.role === 'LABORATORY') {
        const laboratory = await prisma.laboratory.findUnique({
          where: { userId: req.user.userId },
        });
        if (!laboratory) {
          throw new AppError('Laboratory not found', 404);
        }
        laboratoryId = laboratory.id;
      } else {
        laboratoryId = req.query.laboratoryId as string;
        if (!laboratoryId) {
          throw new AppError('Laboratory ID is required', 400);
        }
      }

      const dashboard = await DashboardService.getLaboratoryDashboard(laboratoryId);
      
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Advanced analytics
router.get(
  '/analytics',
  authenticate,
  authorize('ADMIN', 'BRAND'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('brandId').optional().isUUID(),
    query('category').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        brandId: req.query.brandId as string,
        category: req.query.category as string,
      };

      // If user is a brand, force their brandId
      if (req.user?.role === 'BRAND') {
        const brand = await prisma.brand.findUnique({
          where: { userId: req.user.userId },
        });
        filters.brandId = brand?.id || '';
      }

      const analytics = await DashboardService.getAdvancedAnalytics(filters);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Queue statistics
router.get(
  '/queues',
  authenticate,
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const { getQueueStats } = await import('../services/queue');
      const stats = await getQueueStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;