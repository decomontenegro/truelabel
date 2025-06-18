import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { twoFactorService } from '../twoFactorService';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      update: jest.fn(),
      findUnique: jest.fn()
    }
  }))
}));

// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  }
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

describe('TwoFactorService', () => {
  let mockPrisma: any;
  
  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a 2FA secret and QR code', async () => {
      const userId = 'user123';
      const userEmail = 'test@example.com';
      const mockSecret = {
        base32: 'MOCKBASE32SECRET',
        otpauth_url: 'otpauth://totp/TrustLabel:test@example.com?secret=MOCKBASE32SECRET'
      };
      
      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (require('qrcode').toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockqrcode');
      mockPrisma.user.update.mockResolvedValue({});
      
      const result = await twoFactorService.generateSecret(userId, userEmail);
      
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'Trust Label (test@example.com)',
        issuer: 'Trust Label',
        length: 32
      });
      
      expect(result).toHaveProperty('secret', 'MOCKBASE32SECRET');
      expect(result).toHaveProperty('qrCode', 'data:image/png;base64,mockqrcode');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10);
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          twoFactorSecret: expect.any(String),
          twoFactorBackupCodes: expect.any(Array),
          twoFactorEnabled: false
        })
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid TOTP token', () => {
      const secret = 'TESTSECRET';
      const token = '123456';
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      
      const result = twoFactorService.verifyToken(secret, token);
      
      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });
    });

    it('should reject an invalid TOTP token', () => {
      const secret = 'TESTSECRET';
      const token = '000000';
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      
      const result = twoFactorService.verifyToken(secret, token);
      
      expect(result).toBe(false);
    });
  });

  describe('verifyAndEnable', () => {
    it('should enable 2FA when token is valid', async () => {
      const userId = 'user123';
      const token = '123456';
      const encryptedSecret = 'encrypted:secret:data';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false
      });
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      
      const result = await twoFactorService.verifyAndEnable(userId, token);
      
      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });
    });

    it('should throw error if 2FA already enabled', async () => {
      const userId = 'user123';
      const token = '123456';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'encrypted:secret',
        twoFactorEnabled: true
      });
      
      await expect(twoFactorService.verifyAndEnable(userId, token))
        .rejects.toThrow('2FA already enabled');
    });

    it('should throw error if 2FA not set up', async () => {
      const userId = 'user123';
      const token = '123456';
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      await expect(twoFactorService.verifyAndEnable(userId, token))
        .rejects.toThrow('2FA not set up for this user');
    });
  });

  describe('verifyUserToken', () => {
    it('should verify a valid TOTP token for user', async () => {
      const userId = 'user123';
      const token = '123456';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'encrypted:secret',
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['AAAA-BBBB', 'CCCC-DDDD']
      });
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      
      const result = await twoFactorService.verifyUserToken(userId, token);
      
      expect(result).toBe(true);
    });

    it('should verify a valid backup code', async () => {
      const userId = 'user123';
      const backupCode = 'AAAA-BBBB';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'encrypted:secret',
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['AAAA-BBBB', 'CCCC-DDDD']
      });
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      mockPrisma.user.update.mockResolvedValue({});
      
      const result = await twoFactorService.verifyUserToken(userId, backupCode);
      
      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { twoFactorBackupCodes: ['CCCC-DDDD'] }
      });
    });

    it('should return false for invalid token and backup code', async () => {
      const userId = 'user123';
      const token = 'invalid';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorSecret: 'encrypted:secret',
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['AAAA-BBBB']
      });
      
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      
      const result = await twoFactorService.verifyUserToken(userId, token);
      
      expect(result).toBe(false);
    });
  });

  describe('disable', () => {
    it('should disable 2FA for user', async () => {
      const userId = 'user123';
      
      mockPrisma.user.update.mockResolvedValue({});
      
      await twoFactorService.disable(userId);
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: []
        }
      });
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const userId = 'user123';
      
      mockPrisma.user.update.mockResolvedValue({});
      
      const codes = await twoFactorService.regenerateBackupCodes(userId);
      
      expect(codes).toHaveLength(10);
      expect(codes[0]).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { twoFactorBackupCodes: codes }
      });
    });
  });

  describe('isEnabled', () => {
    it('should return true if 2FA is enabled', async () => {
      const userId = 'user123';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorEnabled: true
      });
      
      const result = await twoFactorService.isEnabled(userId);
      
      expect(result).toBe(true);
    });

    it('should return false if 2FA is not enabled', async () => {
      const userId = 'user123';
      
      mockPrisma.user.findUnique.mockResolvedValue({
        twoFactorEnabled: false
      });
      
      const result = await twoFactorService.isEnabled(userId);
      
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      const userId = 'user123';
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const result = await twoFactorService.isEnabled(userId);
      
      expect(result).toBe(false);
    });
  });
});