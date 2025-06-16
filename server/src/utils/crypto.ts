import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment');
  }
  return Buffer.from(key, 'hex');
};

// Field-level encryption for PII
export const encryptField = (text: string): string => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Field-level decryption
export const decryptField = (encryptedData: string): string => {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash sensitive data for comparison (e.g., API keys)
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate API key
export const generateApiKey = (): { key: string; hash: string } => {
  const key = `tlk_${generateSecureToken(32)}`;
  const hash = hashData(key);
  return { key, hash };
};

// Password hashing with bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Password verification
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate OTP
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
};

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('base64');
};

// Verify CSRF token
export const verifyCSRFToken = (token: string, sessionToken: string): boolean => {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  );
};

// Sign data with HMAC
export const signData = (data: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

// Verify HMAC signature
export const verifySignature = (data: string, signature: string, secret: string): boolean => {
  const expectedSignature = signData(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Mask PII for logging
export const maskPII = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
};

// Email masking
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = maskPII(localPart, 2);
  return `${maskedLocal}@${domain}`;
};

// Phone masking
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return '*'.repeat(cleaned.length);
  }
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};

// CPF masking (Brazilian ID)
export const maskCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) {
    return maskPII(cleaned);
  }
  return `***.***.***-${cleaned.slice(-2)}`;
};

// Secure data comparison (timing-safe)
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
};

// Generate secure session ID
export const generateSessionId = (): string => {
  return `sess_${generateSecureToken(32)}`;
};

// Key derivation for encryption
export const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256');
};

// Encrypt file
export const encryptFile = async (buffer: Buffer): Promise<{ encrypted: Buffer; key: string; iv: string }> => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return {
    encrypted,
    key: key.toString('hex'),
    iv: iv.toString('hex')
  };
};

// Decrypt file
export const decryptFile = async (encrypted: Buffer, key: string, iv: string): Promise<Buffer> => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

// Export utilities
export default {
  encryptField,
  decryptField,
  hashData,
  generateSecureToken,
  generateApiKey,
  hashPassword,
  verifyPassword,
  generateOTP,
  generateCSRFToken,
  verifyCSRFToken,
  signData,
  verifySignature,
  maskPII,
  maskEmail,
  maskPhone,
  maskCPF,
  secureCompare,
  generateSessionId,
  deriveKey,
  encryptFile,
  decryptFile
};