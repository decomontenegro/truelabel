"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/reports', (0, rateLimiter_1.rateLimiter)(5, 15), uploadController_1.upload.single('file'), uploadController_1.uploadReport);
router.get('/reports/product/:productId', uploadController_1.getProductReports);
router.get('/reports/:reportId/download', uploadController_1.downloadReport);
exports.default = router;
//# sourceMappingURL=upload.js.map