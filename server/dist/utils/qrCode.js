"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeBuffer = exports.generateQRCodeBase64 = exports.generateQRCode = exports.generateUniqueCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generateUniqueCode = () => {
    return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 16).toUpperCase();
};
exports.generateUniqueCode = generateUniqueCode;
const generateQRCode = async (productId) => {
    const uniqueCode = (0, exports.generateUniqueCode)();
    const validationUrl = `${process.env.QR_CODE_BASE_URL}/${uniqueCode}`;
    try {
        const qrDir = path_1.default.join(process.env.UPLOAD_PATH || './uploads', 'qr-codes');
        if (!fs_1.default.existsSync(qrDir)) {
            fs_1.default.mkdirSync(qrDir, { recursive: true });
        }
        const qrPath = path_1.default.join(qrDir, `${uniqueCode}.png`);
        await qrcode_1.default.toFile(qrPath, validationUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return uniqueCode;
    }
    catch (error) {
        console.error('Erro ao gerar QR code:', error);
        throw new Error('Falha ao gerar QR code');
    }
};
exports.generateQRCode = generateQRCode;
const generateQRCodeBase64 = async (data) => {
    try {
        const qrString = await qrcode_1.default.toString(data, {
            type: 'svg',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrString;
    }
    catch (error) {
        console.error('Erro ao gerar QR code base64:', error);
        throw new Error('Falha ao gerar QR code');
    }
};
exports.generateQRCodeBase64 = generateQRCodeBase64;
const generateQRCodeBuffer = async (data) => {
    try {
        const buffer = await qrcode_1.default.toBuffer(data, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return buffer;
    }
    catch (error) {
        console.error('Erro ao gerar QR code buffer:', error);
        throw new Error('Falha ao gerar QR code');
    }
};
exports.generateQRCodeBuffer = generateQRCodeBuffer;
//# sourceMappingURL=qrCode.js.map