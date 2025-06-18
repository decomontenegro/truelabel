"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptFile = exports.encryptFile = exports.deriveKey = exports.generateSessionId = exports.secureCompare = exports.maskCPF = exports.maskPhone = exports.maskEmail = exports.maskPII = exports.verifySignature = exports.signData = exports.verifyCSRFToken = exports.generateCSRFToken = exports.generateOTP = exports.verifyPassword = exports.hashPassword = exports.generateApiKey = exports.generateSecureToken = exports.hashData = exports.decryptField = exports.encryptField = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("./logger");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY not set in environment');
    }
    return Buffer.from(key, 'hex');
};
const encryptField = (text) => {
    try {
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const salt = crypto_1.default.randomBytes(SALT_LENGTH);
        const key = crypto_1.default.pbkdf2Sync(getEncryptionKey(), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }
    catch (error) {
        logger_1.logger.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};
exports.encryptField = encryptField;
const decryptField = (encryptedData) => {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const salt = buffer.slice(0, SALT_LENGTH);
        const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const key = crypto_1.default.pbkdf2Sync(getEncryptionKey(), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        return decipher.update(encrypted) + decipher.final('utf8');
    }
    catch (error) {
        logger_1.logger.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};
exports.decryptField = decryptField;
const hashData = (data) => {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.hashData = hashData;
const generateSecureToken = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const generateApiKey = () => {
    const key = `tlk_${(0, exports.generateSecureToken)(32)}`;
    const hash = (0, exports.hashData)(key);
    return { key, hash };
};
exports.generateApiKey = generateApiKey;
const hashPassword = async (password) => {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hash) => {
    return bcryptjs_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[crypto_1.default.randomInt(0, digits.length)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const generateCSRFToken = () => {
    return crypto_1.default.randomBytes(32).toString('base64');
};
exports.generateCSRFToken = generateCSRFToken;
const verifyCSRFToken = (token, sessionToken) => {
    return crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
};
exports.verifyCSRFToken = verifyCSRFToken;
const signData = (data, secret) => {
    return crypto_1.default
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
};
exports.signData = signData;
const verifySignature = (data, signature, secret) => {
    const expectedSignature = (0, exports.signData)(data, secret);
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
exports.verifySignature = verifySignature;
const maskPII = (data, visibleChars = 4) => {
    if (data.length <= visibleChars) {
        return '*'.repeat(data.length);
    }
    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + visible;
};
exports.maskPII = maskPII;
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const maskedLocal = (0, exports.maskPII)(localPart, 2);
    return `${maskedLocal}@${domain}`;
};
exports.maskEmail = maskEmail;
const maskPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) {
        return '*'.repeat(cleaned.length);
    }
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};
exports.maskPhone = maskPhone;
const maskCPF = (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) {
        return (0, exports.maskPII)(cleaned);
    }
    return `***.***.***-${cleaned.slice(-2)}`;
};
exports.maskCPF = maskCPF;
const secureCompare = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
exports.secureCompare = secureCompare;
const generateSessionId = () => {
    return `sess_${(0, exports.generateSecureToken)(32)}`;
};
exports.generateSessionId = generateSessionId;
const deriveKey = (password, salt) => {
    return crypto_1.default.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
};
exports.deriveKey = deriveKey;
const encryptFile = async (buffer) => {
    const key = crypto_1.default.randomBytes(32);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return {
        encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex')
    };
};
exports.encryptFile = encryptFile;
const decryptFile = async (encrypted, key, iv) => {
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
exports.decryptFile = decryptFile;
exports.default = {
    encryptField: exports.encryptField,
    decryptField: exports.decryptField,
    hashData: exports.hashData,
    generateSecureToken: exports.generateSecureToken,
    generateApiKey: exports.generateApiKey,
    hashPassword: exports.hashPassword,
    verifyPassword: exports.verifyPassword,
    generateOTP: exports.generateOTP,
    generateCSRFToken: exports.generateCSRFToken,
    verifyCSRFToken: exports.verifyCSRFToken,
    signData: exports.signData,
    verifySignature: exports.verifySignature,
    maskPII: exports.maskPII,
    maskEmail: exports.maskEmail,
    maskPhone: exports.maskPhone,
    maskCPF: exports.maskCPF,
    secureCompare: exports.secureCompare,
    generateSessionId: exports.generateSessionId,
    deriveKey: exports.deriveKey,
    encryptFile: exports.encryptFile,
    decryptFile: exports.decryptFile
};
//# sourceMappingURL=crypto.js.map