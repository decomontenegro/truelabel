"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const privacy_service_1 = require("../services/privacy.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get('/consents', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const consents = await privacy_service_1.PrivacyService.getUserConsents(req.user.id);
        res.json(consents);
    }
    catch (error) {
        next(error);
    }
});
router.post('/consents', auth_1.authenticateToken, [
    (0, express_validator_1.body)('consents.analytics').isBoolean().optional(),
    (0, express_validator_1.body)('consents.marketing').isBoolean().optional()
], validation_1.validateRequest, async (req, res, next) => {
    try {
        const { consents } = req.body;
        const ipAddress = req.ip || 'unknown';
        for (const [type, granted] of Object.entries(consents)) {
            await privacy_service_1.PrivacyService.updateConsent(req.user.id, type.toUpperCase(), granted, ipAddress);
        }
        res.json({
            success: true,
            message: 'Consent preferences updated'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/data/export', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const format = req.query.format || 'json';
        if (!['json', 'csv'].includes(format)) {
            throw (0, errorHandler_1.createError)('Invalid format. Use json or csv', 400);
        }
        logger_1.logger.info('Personal data export requested', {
            userId: req.user.id,
            format
        });
        const data = await privacy_service_1.PrivacyService.exportUserData(req.user.id, format);
        res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=personal-data-${Date.now()}.${format}`);
        res.send(data);
    }
    catch (error) {
        next(error);
    }
});
router.post('/data/portability', auth_1.authenticateToken, async (req, res, next) => {
    try {
        logger_1.logger.info('Data portability requested', { userId: req.user.id });
        const exportData = await privacy_service_1.PrivacyService.handlePortabilityRequest(req.user.id);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=truelabel-data-export-${Date.now()}.json`);
        res.send(exportData);
    }
    catch (error) {
        next(error);
    }
});
router.post('/data/delete', auth_1.authenticateToken, [
    (0, express_validator_1.body)('reason').notEmpty().withMessage('Reason is required'),
    (0, express_validator_1.body)('confirmEmail').isEmail().withMessage('Confirmation email is required')
], validation_1.validateRequest, async (req, res, next) => {
    try {
        const { reason, confirmEmail } = req.body;
        if (confirmEmail !== req.user.email) {
            throw (0, errorHandler_1.createError)('Email confirmation does not match', 400);
        }
        const { canDelete, reasons } = await privacy_service_1.PrivacyService.canDeleteUser(req.user.id);
        if (!canDelete) {
            throw (0, errorHandler_1.createError)(`Cannot delete account: ${reasons.join(', ')}. Please resolve these issues first.`, 400);
        }
        logger_1.logger.warn('Account deletion requested', {
            userId: req.user.id,
            reason
        });
        await privacy_service_1.PrivacyService.deleteUserData(req.user.id, reason);
        res.json({
            success: true,
            message: 'Your data deletion request has been processed. You will receive a confirmation email.'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/data/rectify', auth_1.authenticateToken, [
    (0, express_validator_1.body)('updates').isObject().withMessage('Updates must be an object'),
    (0, express_validator_1.body)('reason').notEmpty().withMessage('Reason is required')
], validation_1.validateRequest, async (req, res, next) => {
    try {
        const { updates, reason } = req.body;
        const allowedFields = ['name', 'phone', 'email'];
        const updateFields = Object.keys(updates);
        const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
        if (invalidFields.length > 0) {
            throw (0, errorHandler_1.createError)(`Cannot update fields: ${invalidFields.join(', ')}`, 400);
        }
        logger_1.logger.info('Data rectification requested', {
            userId: req.user.id,
            fields: updateFields,
            reason
        });
        await privacy_service_1.PrivacyService.rectifyUserData(req.user.id, updates, reason);
        res.json({
            success: true,
            message: 'Your data has been updated'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/requests', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const requests = await privacy_service_1.PrivacyService.getUserPrivacyRequests(req.user.id);
        res.json({
            requests,
            total: requests.length
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/policy/version', async (req, res) => {
    res.json({
        version: '1.0',
        lastUpdated: '2024-01-16',
        url: 'https://truelabel.com.br/privacy-policy'
    });
});
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
exports.default = router;
//# sourceMappingURL=privacy.js.map