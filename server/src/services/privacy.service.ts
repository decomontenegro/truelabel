import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import crypto from '../utils/crypto';
import { User, ConsentType, PrivacyRequest } from '@prisma/client';

export class PrivacyService {
  /**
   * Get user's personal data (LGPD: Right to Access)
   */
  static async getUserData(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
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

      // Decrypt PII fields
      const decryptedUser = {
        ...user,
        email: user.email, // Already visible
        name: crypto.decryptField(user.name),
        phone: user.phone ? crypto.decryptField(user.phone) : null,
        cpf: user.cpf ? crypto.decryptField(user.cpf) : null
      };

      return this.formatUserDataExport(decryptedUser);
    } catch (error) {
      logger.error('Error getting user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data (LGPD: Right to Erasure)
   */
  static async deleteUserData(userId: string, requestReason: string): Promise<void> {
    try {
      // Create privacy request record
      const request = await prisma.privacyRequest.create({
        data: {
          userId,
          type: 'DELETION',
          status: 'PENDING',
          reason: requestReason
        }
      });

      // Start transaction for data deletion
      await prisma.$transaction(async (tx) => {
        // Anonymize user data instead of hard delete
        const anonymizedData = {
          email: `deleted-${userId}@anonymous.com`,
          name: crypto.encryptField('DELETED_USER'),
          phone: null,
          cpf: null,
          avatar: null,
          active: false,
          deletedAt: new Date()
        };

        // Update user record
        await tx.user.update({
          where: { id: userId },
          data: anonymizedData
        });

        // Delete or anonymize related data
        // 1. Remove from brands
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

        // 2. Anonymize audit logs
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

        // 3. Delete sessions
        await tx.session.deleteMany({
          where: { userId }
        });

        // 4. Delete API keys
        await tx.apiKey.deleteMany({
          where: { userId }
        });

        // 5. Update privacy request
        await tx.privacyRequest.update({
          where: { id: request.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });

        // Log the deletion
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

      // Send confirmation email (to a different email if provided)
      // await EmailService.sendDataDeletionConfirmation(user.email);

      logger.info('User data deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Update user consent preferences
   */
  static async updateConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string
  ): Promise<void> {
    try {
      const existingConsent = await prisma.consent.findFirst({
        where: {
          userId,
          type: consentType
        }
      });

      if (existingConsent) {
        await prisma.consent.update({
          where: { id: existingConsent.id },
          data: {
            granted,
            ipAddress,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.consent.create({
          data: {
            userId,
            type: consentType,
            granted,
            ipAddress,
            version: '1.0' // Current privacy policy version
          }
        });
      }

      // Log consent change
      await prisma.privacyLog.create({
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
    } catch (error) {
      logger.error('Error updating consent:', error);
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  static async getUserConsents(userId: string): Promise<any> {
    try {
      const consents = await prisma.consent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Group by type, showing latest consent for each type
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
        necessary: true, // Always true for necessary cookies
        consents: Array.from(consentMap.values())
      };
    } catch (error) {
      logger.error('Error getting user consents:', error);
      throw error;
    }
  }

  /**
   * Export user data in machine-readable format
   */
  static async exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const userData = await this.getUserData(userId);

      if (format === 'json') {
        return JSON.stringify(userData, null, 2);
      } else {
        // Convert to CSV format
        return this.convertToCSV(userData);
      }
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Handle data portability request
   */
  static async handlePortabilityRequest(userId: string): Promise<string> {
    try {
      // Create privacy request
      await prisma.privacyRequest.create({
        data: {
          userId,
          type: 'PORTABILITY',
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Export all user data
      const userData = await this.getUserData(userId);
      
      // Create a downloadable file
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
    } catch (error) {
      logger.error('Error handling portability request:', error);
      throw error;
    }
  }

  /**
   * Rectify user data (LGPD: Right to Rectification)
   */
  static async rectifyUserData(
    userId: string,
    updates: Partial<User>,
    reason: string
  ): Promise<void> {
    try {
      // Create privacy request
      await prisma.privacyRequest.create({
        data: {
          userId,
          type: 'RECTIFICATION',
          status: 'COMPLETED',
          reason,
          completedAt: new Date()
        }
      });

      // Encrypt PII fields if present
      const encryptedUpdates: any = { ...updates };
      if (updates.name) {
        encryptedUpdates.name = crypto.encryptField(updates.name);
      }
      if (updates.phone) {
        encryptedUpdates.phone = crypto.encryptField(updates.phone);
      }
      if (updates.cpf) {
        encryptedUpdates.cpf = crypto.encryptField(updates.cpf);
      }

      // Update user data
      await prisma.user.update({
        where: { id: userId },
        data: encryptedUpdates
      });

      // Log the rectification
      await prisma.privacyLog.create({
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
    } catch (error) {
      logger.error('Error rectifying user data:', error);
      throw error;
    }
  }

  /**
   * Get privacy requests for a user
   */
  static async getUserPrivacyRequests(userId: string): Promise<PrivacyRequest[]> {
    return prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if user can be deleted
   */
  static async canDeleteUser(userId: string): Promise<{ canDelete: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    
    // Check for active validations
    const activeValidations = await prisma.validation.count({
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

    // Check for pending reports
    const pendingReports = await prisma.report.count({
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

  /**
   * Format user data for export
   */
  private static formatUserDataExport(user: any): any {
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
      brands: user.brands.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        cnpj: crypto.maskPII(brand.cnpj),
        products: brand.products.length,
        createdAt: brand.createdAt
      })),
      laboratories: user.laboratories.map((lab: any) => ({
        id: lab.id,
        name: lab.name,
        validations: lab.validations.length,
        reports: lab.reports.length
      })),
      consents: user.consents,
      privacyRequests: user.privacyRequests,
      activityLog: user.auditLogs.map((log: any) => ({
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: crypto.maskPII(log.ipAddress)
      }))
    };
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in production use a proper CSV library
    const lines: string[] = [];
    
    // Personal Information
    lines.push('Category,Field,Value');
    lines.push(`Personal Information,ID,${data.personalInformation.id}`);
    lines.push(`Personal Information,Email,${data.personalInformation.email}`);
    lines.push(`Personal Information,Name,${data.personalInformation.name}`);
    lines.push(`Personal Information,Phone,${data.personalInformation.phone || 'N/A'}`);
    lines.push(`Personal Information,CPF,${data.personalInformation.cpf || 'N/A'}`);
    lines.push(`Personal Information,Role,${data.personalInformation.role}`);
    lines.push(`Personal Information,Created At,${data.personalInformation.createdAt}`);
    
    // Add more sections as needed
    
    return lines.join('\n');
  }
}

export default PrivacyService;