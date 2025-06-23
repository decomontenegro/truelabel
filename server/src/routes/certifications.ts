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
router.post('/:id/verify', verifyCertification);

// Protected routes
router.use(authenticateToken);

// Special endpoints (must come before :id routes)
router.get('/expiring-soon', getExpiringCertifications);
router.get('/statistics', getCertificationStatistics);
router.get('/alerts', getCertificationAlerts);
router.get('/expiration-alerts', getCertificationAlerts); // Alias for compatibility

// Certification CRUD
router.get('/', getCertifications);
router.get('/:id', getCertificationById);
router.post('/', createCertification);
router.put('/:id', updateCertification);
router.delete('/:id', deleteCertification);

// Product certifications
router.get('/products/:productId/certifications', getProductCertifications);

// Timeline (after special endpoints)
router.get('/:id/timeline', getCertificationTimeline);

// Alert management
router.put('/alerts/:alertId/read', markAlertAsRead);
router.put('/alerts/settings', configureAlertSettings);

// Badge generation
router.post('/badges/generate', generateBadge);

export default router;