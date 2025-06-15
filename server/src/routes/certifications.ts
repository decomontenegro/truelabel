import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCertifications,
  getCertificationById,
  createCertification,
  updateCertification,
  deleteCertification,
  getProductCertifications,
  getExpiringCertifications,
  getCertificationStatistics,
  getCertificationAlerts,
  markAlertAsRead,
  configureAlertSettings,
  verifyCertification,
  generateBadge,
  getCertificationTimeline
} from '../controllers/certificationController';

const router = Router();

// Public routes (for verification)
router.post('/certifications/:id/verify', verifyCertification);

// Protected routes
router.use(authenticateToken);

// Special endpoints (must come before :id routes)
router.get('/certifications/expiring-soon', getExpiringCertifications);
router.get('/certifications/statistics', getCertificationStatistics);
router.get('/certifications/alerts', getCertificationAlerts);
router.get('/certifications/expiration-alerts', getCertificationAlerts); // Alias for compatibility

// Certification CRUD
router.get('/certifications', getCertifications);
router.get('/certifications/:id', getCertificationById);
router.post('/certifications', createCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Product certifications
router.get('/products/:productId/certifications', getProductCertifications);

// Timeline (after special endpoints)
router.get('/certifications/:id/timeline', getCertificationTimeline);

// Alert management
router.put('/certifications/alerts/:alertId/read', markAlertAsRead);
router.put('/certifications/alerts/settings', configureAlertSettings);

// Badge generation
router.post('/certifications/badges/generate', generateBadge);

export default router;