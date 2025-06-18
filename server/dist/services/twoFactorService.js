"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorService = exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class TwoFactorService {
    constructor() {
        this.appName = 'Trust Label';
    }
    async generateSecret(userId, userEmail) {
        const secret = speakeasy_1.default.generateSecret({
            name: `${this.appName} (${userEmail})`,
            issuer: this.appName,
            length: 32
        });
        const backupCodes = this.generateBackupCodes();
        const encryptedSecret = this.encryptSecret(secret.base32);
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: encryptedSecret,
                twoFactorBackupCodes: backupCodes,
                twoFactorEnabled: false
            }
        });
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            backupCodes
        };
    }
    async verifyAndEnable(userId, token) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true
            }
        });
        if (!user || !user.twoFactorSecret) {
            throw new Error('2FA not set up for this user');
        }
        if (user.twoFactorEnabled) {
            throw new Error('2FA already enabled');
        }
        const secret = this.decryptSecret(user.twoFactorSecret);
        const isValid = this.verifyToken(secret, token);
        if (isValid) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true }
            });
            await this.logSecurityEvent(userId, 'TWO_FACTOR_ENABLED');
        }
        return isValid;
    }
    verifyToken(secret, token) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2
        });
    }
    async verifyUserToken(userId, token) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true,
                twoFactorBackupCodes: true
            }
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return false;
        }
        const secret = this.decryptSecret(user.twoFactorSecret);
        const isValidToken = this.verifyToken(secret, token);
        if (isValidToken) {
            await this.logSecurityEvent(userId, 'TWO_FACTOR_VERIFIED');
            return true;
        }
        const isValidBackupCode = await this.verifyBackupCode(userId, token);
        if (isValidBackupCode) {
            await this.logSecurityEvent(userId, 'BACKUP_CODE_USED');
            return true;
        }
        await this.logSecurityEvent(userId, 'TWO_FACTOR_FAILED');
        return false;
    }
    async disable(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: null,
                twoFactorEnabled: false,
                twoFactorBackupCodes: []
            }
        });
        await this.logSecurityEvent(userId, 'TWO_FACTOR_DISABLED');
    }
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
        }
        return codes;
    }
    async verifyBackupCode(userId, code) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorBackupCodes: true }
        });
        if (!user || !user.twoFactorBackupCodes) {
            return false;
        }
        const codeIndex = user.twoFactorBackupCodes.indexOf(code);
        if (codeIndex === -1) {
            return false;
        }
        const newBackupCodes = [...user.twoFactorBackupCodes];
        newBackupCodes.splice(codeIndex, 1);
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: newBackupCodes }
        });
        return true;
    }
    async regenerateBackupCodes(userId) {
        const backupCodes = this.generateBackupCodes();
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: backupCodes }
        });
        await this.logSecurityEvent(userId, 'BACKUP_CODES_REGENERATED');
        return backupCodes;
    }
    async isEnabled(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true }
        });
        return user?.twoFactorEnabled || false;
    }
    encryptSecret(secret) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this', 'utf8').slice(0, 32);
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    decryptSecret(encryptedSecret) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this', 'utf8').slice(0, 32);
        const parts = encryptedSecret.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async logSecurityEvent(userId, event) {
        console.log(`Security Event: ${event} for user ${userId} at ${new Date().toISOString()}`);
    }
}
exports.TwoFactorService = TwoFactorService;
exports.twoFactorService = new TwoFactorService();
//# sourceMappingURL=twoFactorService.js.map