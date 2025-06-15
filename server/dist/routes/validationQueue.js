"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validationQueueController_1 = __importDefault(require("../controllers/validationQueueController"));
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', validationQueueController_1.default.getQueue.bind(validationQueueController_1.default));
router.get('/metrics', (0, requireRole_1.requireRole)('ADMIN'), validationQueueController_1.default.getQueueMetrics.bind(validationQueueController_1.default));
router.post('/', validationQueueController_1.default.createQueueEntry.bind(validationQueueController_1.default));
router.get('/:id', validationQueueController_1.default.getQueueEntry.bind(validationQueueController_1.default));
router.post('/:id/assign', (0, requireRole_1.requireRole)('ADMIN'), validationQueueController_1.default.assignValidation.bind(validationQueueController_1.default));
router.patch('/:id/status', validationQueueController_1.default.updateStatus.bind(validationQueueController_1.default));
router.delete('/:id', validationQueueController_1.default.cancelQueueEntry.bind(validationQueueController_1.default));
exports.default = router;
//# sourceMappingURL=validationQueue.js.map