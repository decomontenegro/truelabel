"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicController_1 = require("../controllers/publicController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const publicApiLimiter = (0, rateLimiter_1.rateLimiter)(100, 15);
const validationLimiter = (0, rateLimiter_1.rateLimiter)(50, 15);
router.get('/validate/:qrCode', validationLimiter, publicController_1.validateProduct);
router.get('/products/category/:category', publicApiLimiter, publicController_1.getProductsByCategory);
router.get('/stats', publicApiLimiter, publicController_1.getPlatformStats);
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'True Label API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=public.js.map