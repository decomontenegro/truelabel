import express from 'express';
import { generateQRCode, validateQRCode, getQRCodeAccesses } from '../controllers/qrController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Gerar QR code para produto (rota protegida)
router.post('/generate', authenticateToken, generateQRCode);

// Validar produto via QR code (rota pública)
router.get('/validate/:qrCode', validateQRCode);

// Obter acessos ao QR code (rota protegida)
router.get('/accesses/:productId', authenticateToken, getQRCodeAccesses);

export default router;
