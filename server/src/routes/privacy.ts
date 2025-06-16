import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrivacyService } from '../services/privacy.service';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Get user's consent status
router.get('/consents', authenticateToken, async (req, res, next) => {
  try {
    const consents = await PrivacyService.getUserConsents(req.user!.id);
    res.json(consents);
  } catch (error) {
    next(error);
  }
});

// Update consent preferences
router.post('/consents', 
  authenticateToken,
  [
    body('consents.analytics').isBoolean().optional(),
    body('consents.marketing').isBoolean().optional()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { consents } = req.body;
      const ipAddress = req.ip || 'unknown';
      
      // Update each consent type
      for (const [type, granted] of Object.entries(consents)) {
        await PrivacyService.updateConsent(
          req.user!.id,
          type.toUpperCase() as any,
          granted as boolean,
          ipAddress
        );
      }
      
      res.json({ 
        success: true,
        message: 'Consent preferences updated'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Request personal data (LGPD: Right to Access)
router.get('/data/export', authenticateToken, async (req, res, next) => {
  try {
    const format = req.query.format as string || 'json';
    
    if (!['json', 'csv'].includes(format)) {
      throw createError('Invalid format. Use json or csv', 400);
    }
    
    logger.info('Personal data export requested', { 
      userId: req.user!.id,
      format 
    });
    
    const data = await PrivacyService.exportUserData(req.user!.id, format as any);
    
    // Set appropriate headers
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=personal-data-${Date.now()}.${format}`);
    
    res.send(data);
  } catch (error) {
    next(error);
  }
});

// Request data portability
router.post('/data/portability', authenticateToken, async (req, res, next) => {
  try {
    logger.info('Data portability requested', { userId: req.user!.id });
    
    const exportData = await PrivacyService.handlePortabilityRequest(req.user!.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=truelabel-data-export-${Date.now()}.json`);
    
    res.send(exportData);
  } catch (error) {
    next(error);
  }
});

// Request data deletion (LGPD: Right to Erasure)
router.post('/data/delete',
  authenticateToken,
  [
    body('reason').notEmpty().withMessage('Reason is required'),
    body('confirmEmail').isEmail().withMessage('Confirmation email is required')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { reason, confirmEmail } = req.body;
      
      // Verify email matches
      if (confirmEmail !== req.user!.email) {
        throw createError('Email confirmation does not match', 400);
      }
      
      // Check if user can be deleted
      const { canDelete, reasons } = await PrivacyService.canDeleteUser(req.user!.id);
      
      if (!canDelete) {
        throw createError(
          `Cannot delete account: ${reasons.join(', ')}. Please resolve these issues first.`,
          400
        );
      }
      
      logger.warn('Account deletion requested', { 
        userId: req.user!.id,
        reason 
      });
      
      await PrivacyService.deleteUserData(req.user!.id, reason);
      
      res.json({
        success: true,
        message: 'Your data deletion request has been processed. You will receive a confirmation email.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Request data rectification (LGPD: Right to Rectification)
router.post('/data/rectify',
  authenticateToken,
  [
    body('updates').isObject().withMessage('Updates must be an object'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { updates, reason } = req.body;
      
      // Validate allowed fields
      const allowedFields = ['name', 'phone', 'email'];
      const updateFields = Object.keys(updates);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        throw createError(`Cannot update fields: ${invalidFields.join(', ')}`, 400);
      }
      
      logger.info('Data rectification requested', { 
        userId: req.user!.id,
        fields: updateFields,
        reason 
      });
      
      await PrivacyService.rectifyUserData(req.user!.id, updates, reason);
      
      res.json({
        success: true,
        message: 'Your data has been updated'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get privacy requests history
router.get('/requests', authenticateToken, async (req, res, next) => {
  try {
    const requests = await PrivacyService.getUserPrivacyRequests(req.user!.id);
    
    res.json({
      requests,
      total: requests.length
    });
  } catch (error) {
    next(error);
  }
});

// Privacy policy version
router.get('/policy/version', async (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2024-01-16',
    url: 'https://truelabel.com.br/privacy-policy'
  });
});

// Cookie information
router.get('/cookies/info', async (req, res) => {
  res.json({
    necessary: {
      name: 'Cookies Necessários',
      description: 'Essenciais para o funcionamento do site',
      cookies: [
        { name: 'session', purpose: 'Manter sessão do usuário', duration: 'Sessão' },
        { name: 'auth-token', purpose: 'Autenticação', duration: '7 dias' },
        { name: 'csrf-token', purpose: 'Proteção contra CSRF', duration: 'Sessão' }
      ]
    },
    analytics: {
      name: 'Cookies Analíticos',
      description: 'Ajudam a entender como os visitantes interagem com o site',
      cookies: [
        { name: '_ga', purpose: 'Google Analytics', duration: '2 anos' },
        { name: '_gid', purpose: 'Google Analytics', duration: '24 horas' }
      ]
    },
    marketing: {
      name: 'Cookies de Marketing',
      description: 'Usados para rastrear visitantes e exibir anúncios relevantes',
      cookies: [
        { name: '_fbp', purpose: 'Facebook Pixel', duration: '3 meses' },
        { name: 'ads_session', purpose: 'Google Ads', duration: '30 dias' }
      ]
    }
  });
});

export default router;