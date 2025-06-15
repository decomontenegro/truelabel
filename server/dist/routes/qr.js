"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const qrController_1 = require("../controllers/qrController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/generate', auth_1.authenticateToken, qrController_1.generateQRCode);
router.get('/validate/:qrCode', qrController_1.validateQRCode);
router.get('/accesses/:productId', auth_1.authenticateToken, qrController_1.getQRCodeAccesses);
exports.default = router;
//# sourceMappingURL=qr.js.map