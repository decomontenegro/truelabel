import { Router } from 'express';
import { 
  upload, 
  uploadReport, 
  getProductReports, 
  downloadReport 
} from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Upload de laudo laboratorial
router.post(
  '/reports',
  rateLimiter(5, 15), // 5 uploads por 15 minutos
  upload.single('file'),
  uploadReport
);

// Listar laudos de um produto
router.get('/reports/product/:productId', getProductReports);

// Download de laudo
router.get('/reports/:reportId/download', downloadReport);

export default router;
