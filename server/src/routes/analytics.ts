import { Router } from 'express';
import { getDashboardAnalytics, getProductAnalytics } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Analytics do dashboard geral
router.get('/dashboard', getDashboardAnalytics);

// Analytics de um produto específico
router.get('/product/:productId', getProductAnalytics);

export default router;
