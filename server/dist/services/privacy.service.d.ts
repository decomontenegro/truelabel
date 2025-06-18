import { User, ConsentType, PrivacyRequest } from '@prisma/client';
export declare class PrivacyService {
    static getUserData(userId: string): Promise<any>;
    static deleteUserData(userId: string, requestReason: string): Promise<void>;
    static updateConsent(userId: string, consentType: ConsentType, granted: boolean, ipAddress: string): Promise<void>;
    static getUserConsents(userId: string): Promise<any>;
    static exportUserData(userId: string, format?: 'json' | 'csv'): Promise<string>;
    static handlePortabilityRequest(userId: string): Promise<string>;
    static rectifyUserData(userId: string, updates: Partial<User>, reason: string): Promise<void>;
    static getUserPrivacyRequests(userId: string): Promise<PrivacyRequest[]>;
    static canDeleteUser(userId: string): Promise<{
        canDelete: boolean;
        reasons: string[];
    }>;
    private static formatUserDataExport;
    private static convertToCSV;
}
export default PrivacyService;
//# sourceMappingURL=privacy.service.d.ts.map