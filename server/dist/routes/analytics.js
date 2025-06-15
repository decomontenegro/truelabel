"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/dashboard', analyticsController_1.getDashboardAnalytics);
router.get('/product/:productId', analyticsController_1.getProductAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.js.map