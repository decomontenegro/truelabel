"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("../utils/crypto"));
class PrivacyService {
    static async getUserData(userId) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    brands: {
                        include: {
                            products: {
                                include: {
                                    validations: true,
                                    qrCodes: {
                                        include: {
                                            scans: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    laboratories: {
                        include: {
                            validations: true,
                            reports: true
                        }
                    },
                    consents: true,
                    privacyRequests: true,
                    auditLogs: {
                        orderBy: { createdAt: 'desc' },
                        take: 100
                    }
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const decryptedUser = {
                ...user,
                email: user.email,
                name: crypto_1.default.decryptField(user.name),
                phone: user.phone ? crypto_1.default.decryptField(user.phone) : null,
                cpf: user.cpf ? crypto_1.default.decryptField(user.cpf) : null
            };
            return this.formatUserDataExport(decryptedUser);
        }
        catch (error) {
            logger_1.logger.error('Error getting user data:', error);
            throw error;
        }
    }
    static async deleteUserData(userId, requestReason) {
        try {
            const request = await prisma_1.prisma.privacyRequest.create({
                data: {
                    userId,
                    type: 'DELETION',
                    status: 'PENDING',
                    reason: requestReason
                }
            });
            await prisma_1.prisma.$transaction(async (tx) => {
                const anonymizedData = {
                    email: `deleted-${userId}@anonymous.com`,
                    name: crypto_1.default.encryptField('DELETED_USER'),
                    phone: null,
                    cpf: null,
                    avatar: null,
                    active: false,
                    deletedAt: new Date()
                };
                await tx.user.update({
                    where: { id: userId },
                    data: anonymizedData
                });
                await tx.brand.updateMany({
                    where: {
                        users: {
                            some: { id: userId }
                        }
                    },
                    data: {
                        users: {
                            disconnect: { id: userId }
                        }
                    }
                });
                await tx.auditLog.updateMany({
                    where: { userId },
                    data: {
                        userId: null,
                        metadata: {
                            anonymized: true,
                            originalUserId: userId
                        }
                    }
                });
                await tx.session.deleteMany({
                    where: { userId }
                });
                await tx.apiKey.deleteMany({
                    where: { userId }
                });
                await tx.privacyRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date()
                    }
                });
                await tx.privacyLog.create({
                    data: {
                        action: 'USER_DATA_DELETED',
                        userId: userId,
                        performedBy: 'SYSTEM',
                        details: {
                            reason: requestReason,
                            timestamp: new Date()
                        }
                    }
                });
            });
            logger_1.logger.info('User data deleted successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting user data:', error);
            throw error;
        }
    }
    static async updateConsent(userId, consentType, granted, ipAddress) {
        try {
            const existingConsent = await prisma_1.prisma.consent.findFirst({
                where: {
                    userId,
                    type: consentType
                }
            });
            if (existingConsent) {
                await prisma_1.prisma.consent.update({
                    where: { id: existingConsent.id },
                    data: {
                        granted,
                        ipAddress,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                await prisma_1.prisma.consent.create({
                    data: {
                        userId,
                        type: consentType,
                        granted,
                        ipAddress,
                        version: '1.0'
                    }
                });
            }
            await prisma_1.prisma.privacyLog.create({
                data: {
                    action: 'CONSENT_UPDATED',
                    userId,
                    performedBy: userId,
                    details: {
                        consentType,
                        granted,
                        ipAddress,
                        timestamp: new Date()
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating consent:', error);
            throw error;
        }
    }
    static async getUserConsents(userId) {
        try {
            const consents = await prisma_1.prisma.consent.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            const consentMap = new Map();
            consents.forEach(consent => {
                if (!consentMap.has(consent.type) ||
                    consent.createdAt > consentMap.get(consent.type).createdAt) {
                    consentMap.set(consent.type, consent);
                }
            });
            return {
                marketing: consentMap.get('MARKETING')?.granted || false,
                analytics: consentMap.get('ANALYTICS')?.granted || false,
                necessary: true,
                consents: Array.from(consentMap.values())
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user consents:', error);
            throw error;
        }
    }
    static async exportUserData(userId, format = 'json') {
        try {
            const userData = await this.getUserData(userId);
            if (format === 'json') {
                return JSON.stringify(userData, null, 2);
            }
            else {
                return this.convertToCSV(userData);
            }
        }
        catch (error) {
            logger_1.logger.error('Error exporting user data:', error);
            throw error;
        }
    }
    static async handlePortabilityRequest(userId) {
        try {
            await prisma_1.prisma.privacyRequest.create({
                data: {
                    userId,
                    type: 'PORTABILITY',
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
            const userData = await this.getUserData(userId);
            const exportData = {
                exportDate: new Date().toISOString(),
                dataSubject: {
                    id: userId,
                    email: userData.email
                },
                personalData: userData,
                metadata: {
                    format: 'JSON',
                    version: '1.0',
                    includesAllData: true
                }
            };
            return JSON.stringify(exportData, null, 2);
        }
        catch (error) {
            logger_1.logger.error('Error handling portability request:', error);
            throw error;
        }
    }
    static async rectifyUserData(userId, updates, reason) {
        try {
            await prisma_1.prisma.privacyRequest.create({
                data: {
                    userId,
                    type: 'RECTIFICATION',
                    status: 'COMPLETED',
                    reason,
                    completedAt: new Date()
                }
            });
            const encryptedUpdates = { ...updates };
            if (updates.name) {
                encryptedUpdates.name = crypto_1.default.encryptField(updates.name);
            }
            if (updates.phone) {
                encryptedUpdates.phone = crypto_1.default.encryptField(updates.phone);
            }
            if (updates.cpf) {
                encryptedUpdates.cpf = crypto_1.default.encryptField(updates.cpf);
            }
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: encryptedUpdates
            });
            await prisma_1.prisma.privacyLog.create({
                data: {
                    action: 'DATA_RECTIFIED',
                    userId,
                    performedBy: userId,
                    details: {
                        fieldsUpdated: Object.keys(updates),
                        reason,
                        timestamp: new Date()
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error rectifying user data:', error);
            throw error;
        }
    }
    static async getUserPrivacyRequests(userId) {
        return prisma_1.prisma.privacyRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async canDeleteUser(userId) {
        const reasons = [];
        const activeValidations = await prisma_1.prisma.validation.count({
            where: {
                OR: [
                    { product: { brand: { users: { some: { id: userId } } } } },
                    { laboratory: { users: { some: { id: userId } } } }
                ],
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });
        if (activeValidations > 0) {
            reasons.push(`User has ${activeValidations} active validations`);
        }
        const pendingReports = await prisma_1.prisma.report.count({
            where: {
                laboratory: { users: { some: { id: userId } } },
                status: 'PENDING'
            }
        });
        if (pendingReports > 0) {
            reasons.push(`User has ${pendingReports} pending reports`);
        }
        return {
            canDelete: reasons.length === 0,
            reasons
        };
    }
    static formatUserDataExport(user) {
        return {
            personalInformation: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                cpf: user.cpf,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            brands: user.brands.map((brand) => ({
                id: brand.id,
                name: brand.name,
                cnpj: crypto_1.default.maskPII(brand.cnpj),
                products: brand.products.length,
                createdAt: brand.createdAt
            })),
            laboratories: user.laboratories.map((lab) => ({
                id: lab.id,
                name: lab.name,
                validations: lab.validations.length,
                reports: lab.reports.length
            })),
            consents: user.consents,
            privacyRequests: user.privacyRequests,
            activityLog: user.auditLogs.map((log) => ({
                action: log.action,
                timestamp: log.createdAt,
                ipAddress: crypto_1.default.maskPII(log.ipAddress)
            }))
        };
    }
    static convertToCSV(data) {
        const lines = [];
        lines.push('Category,Field,Value');
        lines.push(`Personal Information,ID,${data.personalInformation.id}`);
        lines.push(`Personal Information,Email,${data.personalInformation.email}`);
        lines.push(`Personal Information,Name,${data.personalInformation.name}`);
        lines.push(`Personal Information,Phone,${data.personalInformation.phone || 'N/A'}`);
        lines.push(`Personal Information,CPF,${data.personalInformation.cpf || 'N/A'}`);
        lines.push(`Personal Information,Role,${data.personalInformation.role}`);
        lines.push(`Personal Information,Created At,${data.personalInformation.createdAt}`);
        return lines.join('\n');
    }
}
exports.PrivacyService = PrivacyService;
exports.default = PrivacyService;
//# sourceMappingURL=privacy.service.js.map