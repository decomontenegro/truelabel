import { api } from './api';
import { notificationService } from './notificationService';
import { validationService } from './validationService';
import type { Validation, Product } from '../types';

export interface ValidationLifecycleEvent {
  id: string;
  validationId: string;
  productId: string;
  eventType: ValidationEventType;
  timestamp: Date;
  metadata?: Record<string, any>;
  triggeredBy?: string;
}

export enum ValidationEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  FORMULA_CHANGED = 'FORMULA_CHANGED',
  REVALIDATION_REQUIRED = 'REVALIDATION_REQUIRED',
  RENEWED = 'RENEWED'
}

export interface ValidationExpiryWarning {
  validationId: string;
  productId: string;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  warningLevel: 'first' | 'second' | 'urgent' | 'expired';
}

export interface FormulaChangeDetection {
  productId: string;
  hasChanged: boolean;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
    changedAt: Date;
  }[];
  lastValidationDate: Date;
  requiresRevalidation: boolean;
}

export interface RevalidationRequest {
  validationId: string;
  productId: string;
  reason: ValidationEventType;
  requestedAt: Date;
  requestedBy: string;
  metadata?: Record<string, any>;
}

export interface ValidationTimeline {
  productId: string;
  productName: string;
  validations: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    status: string;
    events: ValidationLifecycleEvent[];
  }[];
  currentValidation?: Validation;
  nextRevalidationDate?: Date;
}

class ValidationLifecycleService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly VALIDATION_PERIOD_MONTHS = 12;
  
  // Warning thresholds in days
  private readonly WARNING_THRESHOLDS = {
    FIRST: 90,
    SECOND: 60,
    URGENT: 30
  };

  /**
   * Start monitoring validation lifecycle
   */
  async startMonitoring(): Promise<void> {
    // Run initial check
    await this.monitorValidationLifecycle();
    
    // Schedule periodic checks
    this.scheduleLifecycleChecks();
  }

  /**
   * Stop monitoring validation lifecycle
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Main monitoring process
   */
  async monitorValidationLifecycle(): Promise<void> {
    try {
      console.log('[ValidationLifecycle] Starting lifecycle monitoring...');
      
      // Check for expiring validations
      const expiringValidations = await this.checkExpiringValidations();
      
      // Process each expiring validation
      for (const warning of expiringValidations) {
        await this.handleExpiringValidation(warning);
      }
      
      // Check for products with formula changes
      const productsWithChanges = await this.detectAllFormulaChanges();
      
      // Process formula changes
      for (const change of productsWithChanges) {
        if (change.requiresRevalidation) {
          await this.handleFormulaChange(change);
        }
      }
      
      console.log('[ValidationLifecycle] Monitoring completed');
    } catch (error) {
      console.error('[ValidationLifecycle] Monitoring error:', error);
      
      // Notify admin of monitoring failure
      await notificationService.notify({
        type: 'error',
        title: 'Validation Monitoring Error',
        message: 'Failed to complete validation lifecycle monitoring',
        priority: 'high'
      });
    }
  }

  /**
   * Check for validations expiring soon
   */
  async checkExpiringValidations(): Promise<ValidationExpiryWarning[]> {
    try {
      const response = await api.get('/validations/expiring', {
        params: {
          daysAhead: this.WARNING_THRESHOLDS.FIRST
        }
      });
      
      const validations: Validation[] = response.data;
      const warnings: ValidationExpiryWarning[] = [];
      
      for (const validation of validations) {
        const expiryDate = new Date(validation.expiresAt!);
        const daysUntilExpiry = this.calculateDaysUntilExpiry(expiryDate);
        
        warnings.push({
          validationId: validation.id,
          productId: validation.productId,
          productName: validation.product?.name || 'Unknown Product',
          expiryDate,
          daysUntilExpiry,
          warningLevel: this.determineWarningLevel(daysUntilExpiry)
        });
      }
      
      return warnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to check expiring validations:', error);
      return [];
    }
  }

  /**
   * Detect formula changes for a specific product
   */
  async detectFormulaChanges(productId: string): Promise<FormulaChangeDetection> {
    try {
      const response = await api.get(`/products/${productId}/formula-changes`);
      return response.data;
    } catch (error) {
      console.error(`[ValidationLifecycle] Failed to detect formula changes for product ${productId}:`, error);
      return {
        productId,
        hasChanged: false,
        lastValidationDate: new Date(),
        requiresRevalidation: false
      };
    }
  }

  /**
   * Detect formula changes for all products with active validations
   */
  private async detectAllFormulaChanges(): Promise<FormulaChangeDetection[]> {
    try {
      const response = await api.get('/validations/formula-changes');
      return response.data;
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to detect all formula changes:', error);
      return [];
    }
  }

  /**
   * Trigger revalidation for a validation
   */
  async triggerRevalidation(
    validationId: string, 
    reason: ValidationEventType,
    metadata?: Record<string, any>
  ): Promise<RevalidationRequest> {
    try {
      const validation = await validationService.getValidation(validationId);
      
      const revalidationRequest: RevalidationRequest = {
        validationId,
        productId: validation.productId,
        reason,
        requestedAt: new Date(),
        requestedBy: 'system',
        metadata
      };
      
      // Create lifecycle event
      await this.createLifecycleEvent({
        validationId,
        productId: validation.productId,
        eventType: ValidationEventType.REVALIDATION_REQUIRED,
        timestamp: new Date(),
        metadata: { reason, ...metadata }
      });
      
      // Send notification
      await notificationService.notify({
        type: 'warning',
        title: 'Revalidation Required',
        message: `Validation for ${validation.product?.name} requires renewal: ${reason}`,
        priority: 'high',
        actionUrl: `/products/${validation.productId}/validations`
      });
      
      // Create revalidation request in backend
      const response = await api.post('/validations/revalidation-requests', revalidationRequest);
      
      return response.data;
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to trigger revalidation:', error);
      throw error;
    }
  }

  /**
   * Create validation timeline for a product
   */
  async createValidationTimeline(productId: string): Promise<ValidationTimeline> {
    try {
      const response = await api.get(`/products/${productId}/validation-timeline`);
      return response.data;
    } catch (error) {
      console.error(`[ValidationLifecycle] Failed to create timeline for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule periodic lifecycle checks
   */
  scheduleLifecycleChecks(): void {
    // Clear existing interval if any
    this.stopMonitoring();
    
    // Schedule new interval
    this.monitoringInterval = setInterval(
      () => this.monitorValidationLifecycle(),
      this.MONITORING_INTERVAL_MS
    );
    
    console.log('[ValidationLifecycle] Scheduled periodic checks every 24 hours');
  }

  /**
   * Handle expiring validation
   */
  private async handleExpiringValidation(warning: ValidationExpiryWarning): Promise<void> {
    try {
      // Create lifecycle event
      await this.createLifecycleEvent({
        validationId: warning.validationId,
        productId: warning.productId,
        eventType: warning.warningLevel === 'expired' 
          ? ValidationEventType.EXPIRED 
          : ValidationEventType.EXPIRING_SOON,
        timestamp: new Date(),
        metadata: {
          daysUntilExpiry: warning.daysUntilExpiry,
          warningLevel: warning.warningLevel
        }
      });
      
      // Send appropriate notification
      const notification = this.createExpiryNotification(warning);
      await notificationService.notify(notification);
      
      // If expired, trigger revalidation
      if (warning.warningLevel === 'expired') {
        await this.triggerRevalidation(
          warning.validationId,
          ValidationEventType.EXPIRED,
          { expiryDate: warning.expiryDate }
        );
      }
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to handle expiring validation:', error);
    }
  }

  /**
   * Handle formula change
   */
  private async handleFormulaChange(change: FormulaChangeDetection): Promise<void> {
    try {
      // Get current validation
      const validations = await validationService.getProductValidations(change.productId);
      const currentValidation = validations.find(v => v.status === 'valid');
      
      if (!currentValidation) return;
      
      // Create lifecycle event
      await this.createLifecycleEvent({
        validationId: currentValidation.id,
        productId: change.productId,
        eventType: ValidationEventType.FORMULA_CHANGED,
        timestamp: new Date(),
        metadata: {
          changes: change.changes,
          lastValidationDate: change.lastValidationDate
        }
      });
      
      // Trigger revalidation
      await this.triggerRevalidation(
        currentValidation.id,
        ValidationEventType.FORMULA_CHANGED,
        { changes: change.changes }
      );
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to handle formula change:', error);
    }
  }

  /**
   * Create lifecycle event
   */
  private async createLifecycleEvent(event: Omit<ValidationLifecycleEvent, 'id'>): Promise<void> {
    try {
      await api.post('/validations/lifecycle-events', event);
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to create lifecycle event:', error);
    }
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Determine warning level based on days until expiry
   */
  private determineWarningLevel(daysUntilExpiry: number): 'first' | 'second' | 'urgent' | 'expired' {
    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= this.WARNING_THRESHOLDS.URGENT) return 'urgent';
    if (daysUntilExpiry <= this.WARNING_THRESHOLDS.SECOND) return 'second';
    if (daysUntilExpiry <= this.WARNING_THRESHOLDS.FIRST) return 'first';
    return 'first';
  }

  /**
   * Create expiry notification
   */
  private createExpiryNotification(warning: ValidationExpiryWarning): any {
    const baseNotification = {
      actionUrl: `/products/${warning.productId}/validations`
    };
    
    switch (warning.warningLevel) {
      case 'expired':
        return {
          ...baseNotification,
          type: 'error',
          title: 'Validation Expired',
          message: `Validation for ${warning.productName} has expired`,
          priority: 'critical'
        };
        
      case 'urgent':
        return {
          ...baseNotification,
          type: 'warning',
          title: 'Urgent: Validation Expiring Soon',
          message: `Validation for ${warning.productName} expires in ${warning.daysUntilExpiry} days`,
          priority: 'high'
        };
        
      case 'second':
        return {
          ...baseNotification,
          type: 'warning',
          title: 'Validation Expiring',
          message: `Validation for ${warning.productName} expires in ${warning.daysUntilExpiry} days`,
          priority: 'medium'
        };
        
      case 'first':
      default:
        return {
          ...baseNotification,
          type: 'info',
          title: 'Validation Reminder',
          message: `Validation for ${warning.productName} expires in ${warning.daysUntilExpiry} days`,
          priority: 'low'
        };
    }
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(): Promise<{
    total: number;
    expiringSoon: number;
    expired: number;
    requiresRevalidation: number;
  }> {
    try {
      const response = await api.get('/validations/statistics');
      return response.data;
    } catch (error) {
      console.error('[ValidationLifecycle] Failed to get statistics:', error);
      return {
        total: 0,
        expiringSoon: 0,
        expired: 0,
        requiresRevalidation: 0
      };
    }
  }

  /**
   * Batch process validation renewals
   */
  async batchRenewValidations(validationIds: string[]): Promise<{
    successful: string[];
    failed: string[];
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as string[]
    };
    
    for (const validationId of validationIds) {
      try {
        await this.triggerRevalidation(
          validationId,
          ValidationEventType.RENEWED,
          { batchRenewal: true }
        );
        results.successful.push(validationId);
      } catch (error) {
        console.error(`[ValidationLifecycle] Failed to renew validation ${validationId}:`, error);
        results.failed.push(validationId);
      }
    }
    
    return results;
  }
}

export const validationLifecycleService = new ValidationLifecycleService();