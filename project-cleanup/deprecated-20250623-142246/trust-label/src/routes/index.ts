import { Express } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import validationRoutes from './validation.routes';
import laboratoryRoutes from './laboratory.routes';
import qrcodeRoutes from './qrcode.routes';
import reportRoutes from './report.routes';
import dashboardRoutes from './dashboard.routes';
import publicRoutes from './public.routes';

export function setupRoutes(app: Express) {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/validations', validationRoutes);
  app.use('/api/laboratories', laboratoryRoutes);
  app.use('/api/qrcodes', qrcodeRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  
  // Public routes (no auth required)
  app.use('/api/public', publicRoutes);

  // Serve static files
  app.use('/uploads', express.static('uploads'));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });
}