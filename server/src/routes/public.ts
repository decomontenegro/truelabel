import { Router } from 'express';
import { 
  validateProduct, 
  getProductsByCategory, 
  getPlatformStats 
} from '../controllers/publicController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiting para APIs públicas
const publicApiLimiter = rateLimiter(100, 15); // 100 requests por 15 minutos
const validationLimiter = rateLimiter(50, 15); // 50 validações por 15 minutos

// Validar produto via QR code (endpoint principal para consumidores)
router.get('/validate/:qrCode', validationLimiter, validateProduct);

// Buscar produtos por categoria
router.get('/products/category/:category', publicApiLimiter, getProductsByCategory);

// Estatísticas da plataforma
router.get('/stats', publicApiLimiter, getPlatformStats);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'True Label API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
