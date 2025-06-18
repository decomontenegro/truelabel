import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class TwoFactorService {
  private readonly appName = 'Trust Label';
  
  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId: string, userEmail: string) {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.appName} (${userEmail})`,
      issuer: this.appName,
      length: 32
    });
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store encrypted secret temporarily (not enabled yet)
    const encryptedSecret = this.encryptSecret(secret.base32);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false // Not enabled until verified
      }
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    };
  }
  
  /**
   * Verify and enable 2FA
   */
  async verifyAndEnable(userId: string, token: string): Promise<boolean> {
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
      
      // Log the 2FA enablement
      await this.logSecurityEvent(userId, 'TWO_FACTOR_ENABLED');
    }
    
    return isValid;
  }
  
  /**
   * Verify a 2FA token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps in each direction
    });
  }
  
  /**
   * Verify a 2FA token for a user
   */
  async verifyUserToken(userId: string, token: string): Promise<boolean> {
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
    
    // First try to verify as TOTP token
    const secret = this.decryptSecret(user.twoFactorSecret);
    const isValidToken = this.verifyToken(secret, token);
    
    if (isValidToken) {
      await this.logSecurityEvent(userId, 'TWO_FACTOR_VERIFIED');
      return true;
    }
    
    // If not valid TOTP, check backup codes
    const isValidBackupCode = await this.verifyBackupCode(userId, token);
    if (isValidBackupCode) {
      await this.logSecurityEvent(userId, 'BACKUP_CODE_USED');
      return true;
    }
    
    await this.logSecurityEvent(userId, 'TWO_FACTOR_FAILED');
    return false;
  }
  
  /**
   * Disable 2FA for a user
   */
  async disable(userId: string): Promise<void> {
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
  
  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    
    return codes;
  }
  
  /**
   * Verify and consume a backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
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
    
    // Remove used backup code
    const newBackupCodes = [...user.twoFactorBackupCodes];
    newBackupCodes.splice(codeIndex, 1);
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: newBackupCodes }
    });
    
    return true;
  }
  
  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: backupCodes }
    });
    
    await this.logSecurityEvent(userId, 'BACKUP_CODES_REGENERATED');
    
    return backupCodes;
  }
  
  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });
    
    return user?.twoFactorEnabled || false;
  }
  
  /**
   * Encrypt secret for storage
   */
  private encryptSecret(secret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this', 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  /**
   * Decrypt secret from storage
   */
  private decryptSecret(encryptedSecret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this', 'utf8').slice(0, 32);
    
    const parts = encryptedSecret.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Log security events
   */
  private async logSecurityEvent(userId: string, event: string): Promise<void> {
    // This would log to a security audit table
    console.log(`Security Event: ${event} for user ${userId} at ${new Date().toISOString()}`);
    
    // In production, you would store this in a database
    // await prisma.securityLog.create({
    //   data: {
    //     userId,
    //     event,
    //     timestamp: new Date(),
    //     ipAddress: getCurrentIpAddress(),
    //     userAgent: getCurrentUserAgent()
    //   }
    // });
  }
}

export const twoFactorService = new TwoFactorService();