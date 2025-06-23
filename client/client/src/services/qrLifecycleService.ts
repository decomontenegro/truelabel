import api from './api';
import { qrService } from './qrService';
import { validationService } from './validationService';
import { notificationService } from './notificationService';
import { Validation, ValidationStatus, Product } from '@/types';

// QR Code statuses
export enum QRCodeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING'
}

// QR Code lifecycle data
export interface QRCodeLifecycle {
  qrCode: string;
  productId: string;
  validationId?: string;
  batchNumber?: string;
  status: QRCodeStatus;
  generatedAt: string;
  activatedAt?: string;
  expiredAt?: string;
  suspendedAt?: string;
  revokedAt?: string;
  lastStatusChange: string;
  statusHistory: QRStatusChange[];
  expirationDate?: string;
  autoRenew: boolean;
}

export interface QRStatusChange {
  previousStatus: QRCodeStatus;
  newStatus: QRCodeStatus;
  changedAt: string;
  reason: string;
  changedBy?: string;
}

export interface QRContentUpdate {
  qrCode: string;
  content: {
    validationStatus: ValidationStatus;
    validationSummary?: string;
    validatedAt?: string;
    expirationDate?: string;
    laboratoryName?: string;
    batchInfo?: {
      batchNumber: string;
      manufactureDate?: string;
      expiryDate?: string;
    };
  };
}

export interface BatchQRGenerationRequest {
  productId: string;
  batchNumber: string;
  quantity: number;
  validationId?: string;
  expirationDate?: string;
}

export interface ScheduledExpirationCheck {
  id: string;
  scheduledFor: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  productsToCheck: number;
  productsExpired: number;
  lastRun?: string;
  nextRun?: string;
}

class QRLifecycleService {
  private expirationCheckInterval: NodeJS.Timeout | null = null;
  private readonly EXPIRATION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Automatically generate QR code when validation is approved
   */
  async generateOnApproval(validationId: string): Promise<{
    success: boolean;
    qrCode?: string;
    message: string;
  }> {
    try {
      // Get validation details
      const { validation } = await validationService.getValidation(validationId);
      
      if (!validation) {
        return {
          success: false,
          message: 'Validation not found'
        };
      }

      // Check if validation is approved
      if (validation.status !== ValidationStatus.APPROVED) {
        return {
          success: false,
          message: 'Validation is not approved'
        };
      }

      // Check if QR code already exists
      const hasQR = await qrService.hasQRCode(validation.productId);
      if (hasQR) {
        return {
          success: false,
          message: 'QR code already exists for this product'
        };
      }

      // Generate QR code
      const qrData = await qrService.generateQRCode(validation.productId);

      // Create lifecycle entry
      await this.createLifecycleEntry({
        qrCode: qrData.qrCode,
        productId: validation.productId,
        validationId: validation.id,
        status: QRCodeStatus.ACTIVE,
        activatedAt: new Date().toISOString(),
        expirationDate: validation.lifecycle?.validUntil
      });

      // Send notification
      await notificationService.notifyQRCodeGenerated(
        validation.productId,
        validation.product?.name || 'Product'
      );

      return {
        success: true,
        qrCode: qrData.qrCode,
        message: 'QR code generated successfully'
      };
    } catch (error: any) {
      console.error('Error generating QR on approval:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate QR code'
      };
    }
  }

  /**
   * Invalidate QR code when validation expires
   */
  async invalidateOnExpiry(validationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Get validation details
      const { validation } = await validationService.getValidation(validationId);
      
      if (!validation) {
        return {
          success: false,
          message: 'Validation not found'
        };
      }

      // Update QR code status
      const lifecycle = await this.getLifecycleByValidation(validationId);
      if (!lifecycle) {
        return {
          success: false,
          message: 'QR code lifecycle not found'
        };
      }

      // Update status to expired
      await this.updateQRStatus(lifecycle.qrCode, QRCodeStatus.EXPIRED, 'Validation expired');

      // Send notification
      await notificationService.createNotification({
        title: 'QR Code Expired',
        message: `QR code for ${validation.product?.name || 'product'} has expired due to validation expiry`,
        type: 'warning',
        data: {
          productId: validation.productId,
          validationId: validation.id,
          qrCode: lifecycle.qrCode
        }
      });

      return {
        success: true,
        message: 'QR code invalidated successfully'
      };
    } catch (error: any) {
      console.error('Error invalidating QR on expiry:', error);
      return {
        success: false,
        message: error.message || 'Failed to invalidate QR code'
      };
    }
  }

  /**
   * Generate batch-specific QR codes
   */
  async regenerateForBatch(
    productId: string,
    batchNumber: string
  ): Promise<{
    success: boolean;
    qrCodes?: string[];
    message: string;
  }> {
    try {
      // Check if product has active validation
      const validations = await validationService.getValidationsByProduct(productId);
      const activeValidation = validations.find(v => v.status === ValidationStatus.APPROVED);

      if (!activeValidation) {
        return {
          success: false,
          message: 'No active validation found for product'
        };
      }

      // Generate batch-specific QR code
      const qrData = await api.post('/qr/generate-batch', {
        productId,
        batchNumber,
        validationId: activeValidation.id
      });

      const qrCodes = qrData.data.qrCodes || [qrData.data.qrCode];

      // Create lifecycle entries for batch QR codes
      for (const qrCode of qrCodes) {
        await this.createLifecycleEntry({
          qrCode,
          productId,
          validationId: activeValidation.id,
          batchNumber,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date().toISOString(),
          expirationDate: activeValidation.lifecycle?.validUntil
        });
      }

      return {
        success: true,
        qrCodes,
        message: `Generated ${qrCodes.length} QR code(s) for batch ${batchNumber}`
      };
    } catch (error: any) {
      console.error('Error regenerating batch QR codes:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate batch QR codes'
      };
    }
  }

  /**
   * Update QR content dynamically based on validation status
   */
  async updateQRContent(
    qrCode: string,
    validationData: Partial<Validation>
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Prepare content update
      const contentUpdate: QRContentUpdate = {
        qrCode,
        content: {
          validationStatus: validationData.status || ValidationStatus.PENDING,
          validationSummary: validationData.summary,
          validatedAt: validationData.validatedAt,
          expirationDate: validationData.lifecycle?.validUntil,
          laboratoryName: validationData.report?.laboratory?.name
        }
      };

      // Update QR content via API
      await api.put(`/qr/${qrCode}/content`, contentUpdate);

      // Update lifecycle status if needed
      if (validationData.status === ValidationStatus.EXPIRED) {
        await this.updateQRStatus(qrCode, QRCodeStatus.EXPIRED, 'Validation expired');
      } else if (validationData.status === ValidationStatus.SUSPENDED) {
        await this.updateQRStatus(qrCode, QRCodeStatus.SUSPENDED, 'Validation suspended');
      } else if (validationData.status === ValidationStatus.APPROVED) {
        await this.updateQRStatus(qrCode, QRCodeStatus.ACTIVE, 'Validation reactivated');
      }

      return {
        success: true,
        message: 'QR content updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating QR content:', error);
      return {
        success: false,
        message: error.message || 'Failed to update QR content'
      };
    }
  }

  /**
   * Schedule periodic checks for expired validations
   */
  scheduleExpirationCheck(): void {
    // Clear existing interval if any
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
    }

    // Run immediately
    this.checkExpiredValidations();

    // Schedule periodic checks
    this.expirationCheckInterval = setInterval(() => {
      this.checkExpiredValidations();
    }, this.EXPIRATION_CHECK_INTERVAL);
  }

  /**
   * Stop scheduled expiration checks
   */
  stopExpirationCheck(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }
  }

  /**
   * Check for expired validations and update QR codes
   */
  private async checkExpiredValidations(): Promise<void> {
    try {
      console.log('Running scheduled expiration check...');

      // Get all active QR codes with expiration dates
      const activeQRCodes = await this.getActiveQRCodesWithExpiration();

      let expiredCount = 0;
      const now = new Date();

      for (const qrLifecycle of activeQRCodes) {
        if (qrLifecycle.expirationDate) {
          const expirationDate = new Date(qrLifecycle.expirationDate);
          
          // Check if expired
          if (expirationDate <= now) {
            await this.updateQRStatus(
              qrLifecycle.qrCode,
              QRCodeStatus.EXPIRED,
              'Scheduled expiration check'
            );
            expiredCount++;

            // Send expiration notification
            await notificationService.createNotification({
              title: 'QR Code Expired',
              message: `QR code ${qrLifecycle.qrCode} has expired`,
              type: 'warning',
              data: {
                qrCode: qrLifecycle.qrCode,
                productId: qrLifecycle.productId,
                expiredAt: now.toISOString()
              }
            });
          } else {
            // Check if expiring soon (within 30 days)
            const daysUntilExpiry = Math.ceil(
              (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              // Send expiration warning
              await notificationService.createNotification({
                title: 'QR Code Expiring Soon',
                message: `QR code ${qrLifecycle.qrCode} will expire in ${daysUntilExpiry} days`,
                type: 'warning',
                data: {
                  qrCode: qrLifecycle.qrCode,
                  productId: qrLifecycle.productId,
                  daysUntilExpiry,
                  expirationDate: qrLifecycle.expirationDate
                }
              });
            }
          }
        }
      }

      console.log(`Expiration check completed. ${expiredCount} QR codes expired.`);

      // Log check completion
      await this.logExpirationCheck({
        scheduledFor: now.toISOString(),
        status: 'COMPLETED',
        productsToCheck: activeQRCodes.length,
        productsExpired: expiredCount
      });
    } catch (error) {
      console.error('Error in expiration check:', error);
      
      // Log check failure
      await this.logExpirationCheck({
        scheduledFor: new Date().toISOString(),
        status: 'FAILED',
        productsToCheck: 0,
        productsExpired: 0
      });
    }
  }

  /**
   * Get current status of a QR code
   */
  async getQRStatus(qrCode: string): Promise<{
    status: QRCodeStatus;
    lifecycle?: QRCodeLifecycle;
    validation?: Validation;
    product?: Product;
  }> {
    try {
      // Get QR lifecycle data
      const lifecycle = await this.getLifecycleByQRCode(qrCode);
      
      if (!lifecycle) {
        return {
          status: QRCodeStatus.PENDING,
          lifecycle: undefined
        };
      }

      // Get validation data if available
      let validation: Validation | undefined;
      if (lifecycle.validationId) {
        try {
          const { validation: val } = await validationService.getValidation(lifecycle.validationId);
          validation = val;
        } catch (error) {
          console.error('Error fetching validation:', error);
        }
      }

      // Get product data
      let product: Product | undefined;
      try {
        const response = await api.get(`/products/${lifecycle.productId}`);
        product = response.data.product;
      } catch (error) {
        console.error('Error fetching product:', error);
      }

      return {
        status: lifecycle.status,
        lifecycle,
        validation,
        product
      };
    } catch (error: any) {
      console.error('Error getting QR status:', error);
      return {
        status: QRCodeStatus.PENDING
      };
    }
  }

  /**
   * Regenerate QR code on revalidation
   */
  async regenerateOnRevalidation(
    productId: string,
    newValidationId: string
  ): Promise<{
    success: boolean;
    qrCode?: string;
    message: string;
  }> {
    try {
      // Get existing QR codes for the product
      const existingQRCodes = await this.getQRCodesByProduct(productId);

      // Revoke existing active QR codes
      for (const qr of existingQRCodes) {
        if (qr.status === QRCodeStatus.ACTIVE) {
          await this.updateQRStatus(qr.qrCode, QRCodeStatus.REVOKED, 'Revalidation initiated');
        }
      }

      // Generate new QR code
      const result = await this.generateOnApproval(newValidationId);

      if (result.success) {
        // Send notification
        await notificationService.createNotification({
          title: 'QR Code Regenerated',
          message: `New QR code generated due to product revalidation`,
          type: 'success',
          data: {
            productId,
            validationId: newValidationId,
            qrCode: result.qrCode
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error regenerating QR on revalidation:', error);
      return {
        success: false,
        message: error.message || 'Failed to regenerate QR code'
      };
    }
  }

  /**
   * Suspend QR code temporarily
   */
  async suspendQRCode(
    qrCode: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.updateQRStatus(qrCode, QRCodeStatus.SUSPENDED, reason);

      return {
        success: true,
        message: 'QR code suspended successfully'
      };
    } catch (error: any) {
      console.error('Error suspending QR code:', error);
      return {
        success: false,
        message: error.message || 'Failed to suspend QR code'
      };
    }
  }

  /**
   * Reactivate suspended QR code
   */
  async reactivateQRCode(
    qrCode: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const lifecycle = await this.getLifecycleByQRCode(qrCode);
      
      if (!lifecycle) {
        return {
          success: false,
          message: 'QR code not found'
        };
      }

      if (lifecycle.status !== QRCodeStatus.SUSPENDED) {
        return {
          success: false,
          message: 'QR code is not suspended'
        };
      }

      await this.updateQRStatus(qrCode, QRCodeStatus.ACTIVE, reason);

      return {
        success: true,
        message: 'QR code reactivated successfully'
      };
    } catch (error: any) {
      console.error('Error reactivating QR code:', error);
      return {
        success: false,
        message: error.message || 'Failed to reactivate QR code'
      };
    }
  }

  /**
   * Permanently revoke QR code
   */
  async revokeQRCode(
    qrCode: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.updateQRStatus(qrCode, QRCodeStatus.REVOKED, reason);

      return {
        success: true,
        message: 'QR code revoked permanently'
      };
    } catch (error: any) {
      console.error('Error revoking QR code:', error);
      return {
        success: false,
        message: error.message || 'Failed to revoke QR code'
      };
    }
  }

  /**
   * Generate multiple QR codes for a batch
   */
  async generateBatchQRCodes(
    request: BatchQRGenerationRequest
  ): Promise<{
    success: boolean;
    qrCodes?: string[];
    message: string;
  }> {
    try {
      const qrCodes: string[] = [];

      for (let i = 0; i < request.quantity; i++) {
        const response = await api.post('/qr/generate', {
          productId: request.productId,
          batchNumber: request.batchNumber,
          validationId: request.validationId,
          serialNumber: `${request.batchNumber}-${String(i + 1).padStart(6, '0')}`
        });

        const qrCode = response.data.qrCode;
        qrCodes.push(qrCode);

        // Create lifecycle entry
        await this.createLifecycleEntry({
          qrCode,
          productId: request.productId,
          validationId: request.validationId,
          batchNumber: request.batchNumber,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date().toISOString(),
          expirationDate: request.expirationDate
        });
      }

      return {
        success: true,
        qrCodes,
        message: `Generated ${qrCodes.length} QR codes for batch ${request.batchNumber}`
      };
    } catch (error: any) {
      console.error('Error generating batch QR codes:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate batch QR codes'
      };
    }
  }

  // Helper methods

  private async createLifecycleEntry(data: Partial<QRCodeLifecycle>): Promise<void> {
    try {
      await api.post('/qr/lifecycle', {
        ...data,
        generatedAt: new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        statusHistory: [{
          previousStatus: QRCodeStatus.PENDING,
          newStatus: data.status || QRCodeStatus.PENDING,
          changedAt: new Date().toISOString(),
          reason: 'Initial creation'
        }]
      });
    } catch (error) {
      console.error('Error creating lifecycle entry:', error);
    }
  }

  private async updateQRStatus(
    qrCode: string,
    newStatus: QRCodeStatus,
    reason: string
  ): Promise<void> {
    try {
      const lifecycle = await this.getLifecycleByQRCode(qrCode);
      
      if (!lifecycle) {
        throw new Error('QR lifecycle not found');
      }

      const statusChange: QRStatusChange = {
        previousStatus: lifecycle.status,
        newStatus,
        changedAt: new Date().toISOString(),
        reason
      };

      await api.put(`/qr/lifecycle/${qrCode}`, {
        status: newStatus,
        lastStatusChange: statusChange.changedAt,
        statusHistory: [...(lifecycle.statusHistory || []), statusChange],
        ...(newStatus === QRCodeStatus.EXPIRED && { expiredAt: statusChange.changedAt }),
        ...(newStatus === QRCodeStatus.SUSPENDED && { suspendedAt: statusChange.changedAt }),
        ...(newStatus === QRCodeStatus.REVOKED && { revokedAt: statusChange.changedAt })
      });
    } catch (error) {
      console.error('Error updating QR status:', error);
      throw error;
    }
  }

  private async getLifecycleByQRCode(qrCode: string): Promise<QRCodeLifecycle | null> {
    try {
      const response = await api.get(`/qr/lifecycle/${qrCode}`);
      return response.data.lifecycle;
    } catch (error) {
      return null;
    }
  }

  private async getLifecycleByValidation(validationId: string): Promise<QRCodeLifecycle | null> {
    try {
      const response = await api.get(`/qr/lifecycle/validation/${validationId}`);
      return response.data.lifecycle;
    } catch (error) {
      return null;
    }
  }

  private async getQRCodesByProduct(productId: string): Promise<QRCodeLifecycle[]> {
    try {
      const response = await api.get(`/qr/lifecycle/product/${productId}`);
      return response.data.lifecycles || [];
    } catch (error) {
      return [];
    }
  }

  private async getActiveQRCodesWithExpiration(): Promise<QRCodeLifecycle[]> {
    try {
      const response = await api.get('/qr/lifecycle/active-with-expiration');
      return response.data.lifecycles || [];
    } catch (error) {
      return [];
    }
  }

  private async logExpirationCheck(data: Partial<ScheduledExpirationCheck>): Promise<void> {
    try {
      await api.post('/qr/lifecycle/expiration-check-log', data);
    } catch (error) {
      console.error('Error logging expiration check:', error);
    }
  }
}

// Create singleton instance
export const qrLifecycleService = new QRLifecycleService();

// Auto-start expiration checks
if (typeof window !== 'undefined') {
  // Start expiration checks when the service is loaded
  qrLifecycleService.scheduleExpirationCheck();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    qrLifecycleService.stopExpirationCheck();
  });
}

export default qrLifecycleService;