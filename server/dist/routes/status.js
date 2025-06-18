"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statusController_1 = require("../controllers/statusController");
const router = (0, express_1.Router)();
router.get('/status', statusController_1.statusController.getStatus.bind(statusController_1.statusController));
router.get('/health-check', statusController_1.statusController.healthCheck.bind(statusController_1.statusController));
router.post('/status/webhook', statusController_1.statusController.subscribeWebhook.bind(statusController_1.statusController));
exports.default = router;
//# sourceMappingURL=status.js.map