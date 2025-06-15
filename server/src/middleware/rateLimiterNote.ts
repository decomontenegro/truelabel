// NOTE: Install express-rate-limit in the server directory:
// npm install express-rate-limit

// Then update the QR routes in server/src/routes/qr.ts to use the rate limiters:
/*
import { qrValidationLimiter, qrGenerationLimiter } from '../middleware/rateLimiter';

// Apply rate limiting to routes
router.post('/generate', authenticate, qrGenerationLimiter, generateQRCode);
router.get('/validate/:qrCode', qrValidationLimiter, validateQRCode);
*/

// Rate limiting configuration for QR code validation
export const rateLimiterConfig = {
  qrValidation: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Muitas requisições de validação'
  },
  qrGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour
    message: 'Limite de geração excedido'
  }
};