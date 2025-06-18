import { Router } from 'express';
import { statusController } from '../controllers/statusController';

const router = Router();

// Public endpoints - no authentication required
router.get('/status', statusController.getStatus.bind(statusController));
router.get('/health-check', statusController.healthCheck.bind(statusController));
router.post('/status/webhook', statusController.subscribeWebhook.bind(statusController));

export default router;