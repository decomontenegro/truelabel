export declare class TwoFactorService {
    private readonly appName;
    generateSecret(userId: string, userEmail: string): Promise<{
        secret: string;
        qrCode: void & Promise<string>;
        backupCodes: string[];
    }>;
    verifyAndEnable(userId: string, token: string): Promise<boolean>;
    verifyToken(secret: string, token: string): boolean;
    verifyUserToken(userId: string, token: string): Promise<boolean>;
    disable(userId: string): Promise<void>;
    private generateBackupCodes;
    private verifyBackupCode;
    regenerateBackupCodes(userId: string): Promise<string[]>;
    isEnabled(userId: string): Promise<boolean>;
    private encryptSecret;
    private decryptSecret;
    private logSecurityEvent;
}
export declare const twoFactorService: TwoFactorService;
//# sourceMappingURL=twoFactorService.d.ts.map