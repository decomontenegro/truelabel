import api from './api';
import {
  Validation,
  PaginatedResponse,
  ValidationResult,
  CreateValidationData as TypeCreateValidationData,
  ValidationQueue,
  ValidationMetrics,
  ValidationFeedback
} from '@/types';
import {
  validateProductAnalysis,
  ProductAnalysis,
  ValidationResult as RuleValidationResult,
  calculateOverallStatus,
  generateValidationFeedback
} from '@/config/validationRules';
import { automatedValidationService } from './automatedValidationService';
import { fallbackService, fallbackData } from './fallbackService';

interface ValidationFilters {
  page?: number;
  limit?: number;
  status?: 'APPROVED' | 'REJECTED' | 'PARTIAL' | 'PENDING';
  productId?: string;
}

interface CreateValidationData {
  productId: string;
  reportId?: string;
  type?: 'MANUAL' | 'LABORATORY' | 'AUTOMATED' | 'HYBRID';
  status: 'APPROVED' | 'REJECTED' | 'PARTIAL' | 'PENDING' | 'EXPIRED' | 'REVALIDATION_REQUIRED' | 'SUSPENDED';
  claimsValidated: Record<string, any>;
  dataPoints?: any[];
  summary?: string;
  notes?: string;
  lifecycle?: any;
  confidence?: number;
  automatedAnalysis?: any;
}

interface ValidationStats {
  overview: {
    total: number;
    approved: number;
    rejected: number;
    partial: number;
    pending: number;
  };
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
}

export const validationService = {
  // Listar validações
  async getValidations(filters: ValidationFilters = {}): Promise<PaginatedResponse<Validation>> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/validations?${params.toString()}`);

      // Adaptar resposta da API real
      const validations = response.data.validations || [];
      return {
        data: validations,
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: validations.length,
          totalPages: 1
        },
      };
    } catch (error: any) {
      if (fallbackService.shouldUseFallback(error)) {
        fallbackService.logFallbackUsage('validationService', 'getValidations', error);
        await fallbackService.simulateDelay();

        let filteredValidations = [...fallbackData.validations];

        // Apply filters to fallback data
        if (filters.status) {
          filteredValidations = filteredValidations.filter(v => v.status === filters.status);
        }
        if (filters.productId) {
          filteredValidations = filteredValidations.filter(v => v.productId === filters.productId);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedValidations = filteredValidations.slice(startIndex, endIndex);

        return {
          data: paginatedValidations,
          pagination: {
            page,
            limit,
            total: filteredValidations.length,
            totalPages: Math.ceil(filteredValidations.length / limit)
          }
        };
      }
      throw error;
    }
  },

  // Obter validação específica
  async getValidation(id: string): Promise<{ validation: Validation }> {
    const response = await api.get(`/validations/${id}`);
    return response.data;
  },

  // Criar validação
  async create(data: TypeCreateValidationData): Promise<Validation> {
    const response = await api.post('/validations', data);
    return response.data.validation || response.data;
  },

  // Criar validação (apenas admin) - backward compatibility
  async createValidation(data: CreateValidationData): Promise<{ validation: Validation; message: string }> {
    const response = await api.post('/validations', data);
    return response.data;
  },

  // Queue validation for automated processing
  async queueAutomatedValidation(reportId: string, productId: string, priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'): Promise<{ queueId: string; message: string }> {
    const queueId = await automatedValidationService.queueValidation(reportId, productId, priority);
    return {
      queueId,
      message: `Validation queued for automated processing with priority: ${priority || 'NORMAL'}`
    };
  },

  // Get automated validation queue status
  async getAutomatedQueueStatus(): Promise<any> {
    return automatedValidationService.getQueueStatus();
  },

  // Get automated validation queue item
  async getAutomatedQueueItem(queueId: string): Promise<any> {
    const item = automatedValidationService.getQueueItem(queueId);
    if (!item) {
      throw new Error('Queue item not found');
    }
    return item;
  },

  // Cancel queued automated validation
  async cancelAutomatedValidation(queueId: string): Promise<{ success: boolean; message: string }> {
    const success = automatedValidationService.cancelQueuedValidation(queueId);
    return {
      success,
      message: success ? 'Validation cancelled successfully' : 'Failed to cancel validation'
    };
  },

  // Retry failed automated validation
  async retryAutomatedValidation(queueId: string): Promise<{ success: boolean; message: string }> {
    const success = automatedValidationService.retryFailedValidation(queueId);
    return {
      success,
      message: success ? 'Validation retry scheduled' : 'Failed to retry validation'
    };
  },

  // Atualizar validação (apenas admin)
  async updateValidation(id: string, data: Partial<CreateValidationData>): Promise<{ validation: Validation; message: string }> {
    const response = await api.put(`/validations/${id}`, data);
    return response.data;
  },

  // Obter estatísticas de validações
  async getValidationStats(): Promise<ValidationStats> {
    const response = await api.get('/validations/stats/overview');
    return response.data;
  },

  // Obter validações por produto
  async getValidationsByProduct(productId: string): Promise<Validation[]> {
    const response = await this.getValidations({ productId, limit: 100 });
    return response.data;
  },

  // Obter validações pendentes
  async getPendingValidations(): Promise<Validation[]> {
    const response = await this.getValidations({ status: 'PENDING', limit: 100 });
    return response.data;
  },

  // Obter validações aprovadas
  async getApprovedValidations(): Promise<Validation[]> {
    const response = await this.getValidations({ status: 'APPROVED', limit: 100 });
    return response.data;
  },

  // Validar dados de validação
  validateValidationData(data: CreateValidationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.productId) {
      errors.push('Produto é obrigatório');
    }

    if (data.type === 'LABORATORY' && !data.reportId) {
      errors.push('Relatório é obrigatório para validação laboratorial');
    }

    if (!data.status) {
      errors.push('Status é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Obter status disponíveis
  getAvailableStatuses(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'PENDING', label: 'Pendente', color: 'yellow' },
      { value: 'APPROVED', label: 'Aprovado', color: 'green' },
      { value: 'REJECTED', label: 'Rejeitado', color: 'red' },
      { value: 'PARTIAL', label: 'Parcial', color: 'orange' }
    ];
  },

  // Formatar status para exibição
  formatStatus(status: string): { label: string; color: string } {
    const statuses = this.getAvailableStatuses();
    const found = statuses.find(s => s.value === status);
    return found || { label: status, color: 'gray' };
  },

  // Calcular taxa de aprovação
  calculateApprovalRate(stats: ValidationStats['overview']): number {
    if (stats.total === 0) return 0;
    return (stats.approved / stats.total) * 100;
  },

  // Processar claims validados
  processClaimsValidated(claims: string, validatedClaims: Record<string, any>): Array<{
    claim: string;
    validated: boolean;
    notes?: string;
  }> {
    const claimsArray = claims.split(',').map(c => c.trim());

    return claimsArray.map(claim => ({
      claim,
      validated: validatedClaims[claim]?.validated || false,
      notes: validatedClaims[claim]?.notes || ''
    }));
  },

  // Gerar resumo de validação
  generateValidationSummary(claimsValidated: Record<string, any>): string {
    const validatedCount = Object.values(claimsValidated).filter(
      (claim: any) => claim.validated
    ).length;
    const totalCount = Object.keys(claimsValidated).length;

    if (validatedCount === totalCount) {
      return `Todos os ${totalCount} claims foram validados com sucesso.`;
    } else if (validatedCount === 0) {
      return `Nenhum dos ${totalCount} claims foi validado.`;
    } else {
      return `${validatedCount} de ${totalCount} claims foram validados.`;
    }
  },

  // Verificar se pode editar validação
  canEditValidation(validation: Validation, userRole: string): boolean {
    // Apenas admins podem editar validações
    return userRole === 'ADMIN';
  },

  // Verificar se pode criar validação
  canCreateValidation(userRole: string): boolean {
    // Apenas admins podem criar validações
    return userRole === 'ADMIN';
  },

  // Obter próximas ações recomendadas
  getRecommendedActions(validation: Validation): string[] {
    const actions: string[] = [];

    if (validation.status === 'PENDING') {
      actions.push('Revisar relatório de laboratório');
      actions.push('Validar claims do produto');
      actions.push('Definir status da validação');
    } else if (validation.status === 'PARTIAL') {
      actions.push('Revisar claims não validados');
      actions.push('Solicitar informações adicionais');
      actions.push('Atualizar status se necessário');
    } else if (validation.status === 'APPROVED') {
      actions.push('Gerar QR Code para o produto');
      actions.push('Notificar marca sobre aprovação');
    } else if (validation.status === 'REJECTED') {
      actions.push('Notificar marca sobre rejeição');
      actions.push('Fornecer feedback para melhorias');
    }

    return actions;
  },

  // Formatar data de validação
  formatValidationDate(date: string | null): string {
    if (!date) return 'Não validado';

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Validar QR Code
  async validateQRCode(qrCode: string): Promise<ValidationResult> {
    try {
      const response = await api.get(`/qr/validate/${qrCode}`);
      return {
        isValid: true,
        productId: response.data.productId,
        scans: response.data.scans || 0,
        validatedAt: response.data.validatedAt,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: error.response?.data?.message || 'Código QR inválido'
      };
    }
  },

  // Validate product analysis using regulatory rules
  async validateProductWithRules(analysis: ProductAnalysis): Promise<{
    validationResults: RuleValidationResult[];
    overallStatus: ReturnType<typeof calculateOverallStatus>;
    feedback: ReturnType<typeof generateValidationFeedback>;
    recommendedStatus: 'APPROVED' | 'REJECTED' | 'PARTIAL';
  }> {
    const { results, overallStatus, feedback } = validateProductAnalysis(analysis);
    
    // Map overall status to validation status
    let recommendedStatus: 'APPROVED' | 'REJECTED' | 'PARTIAL';
    switch (overallStatus.status) {
      case 'approved':
        recommendedStatus = 'APPROVED';
        break;
      case 'conditional':
        recommendedStatus = 'PARTIAL';
        break;
      case 'rejected':
        recommendedStatus = 'REJECTED';
        break;
    }

    return {
      validationResults: results,
      overallStatus,
      feedback,
      recommendedStatus
    };
  },

  // Generate validation report summary
  generateValidationReport(validationResults: RuleValidationResult[]): {
    summary: string;
    details: {
      approved: number;
      warnings: number;
      rejected: number;
      criticalIssues: string[];
    };
  } {
    const approved = validationResults.filter(r => r.status === 'approved').length;
    const warnings = validationResults.filter(r => r.status === 'warning').length;
    const rejected = validationResults.filter(r => r.status === 'rejected').length;
    const criticalIssues = validationResults
      .filter(r => r.status === 'rejected')
      .map(r => `${r.parameter}: ${r.message}`);

    let summary = '';
    if (rejected > 0) {
      summary = `Produto reprovado: ${rejected} parâmetro(s) fora dos limites regulatórios`;
    } else if (warnings > 0) {
      summary = `Produto aprovado condicionalmente: ${warnings} parâmetro(s) requerem atenção`;
    } else {
      summary = `Produto aprovado: todos os ${approved} parâmetros estão dentro dos limites`;
    }

    return {
      summary,
      details: {
        approved,
        warnings,
        rejected,
        criticalIssues
      }
    };
  },

  // Check if report meets regulatory requirements
  async checkRegulatoryCompliance(reportData: any): Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Convert report data to ProductAnalysis format
    const analysis: ProductAnalysis = {
      microbiological: reportData.microbiological || [],
      heavyMetals: reportData.heavyMetals || [],
      pesticides: reportData.pesticides || [],
      mycotoxins: reportData.mycotoxins || [],
      nutritional: reportData.nutritional || []
    };

    const { overallStatus, feedback } = validateProductAnalysis(analysis);
    
    // Collect issues from validation
    if (overallStatus.criticalIssues > 0) {
      issues.push(`${overallStatus.criticalIssues} parâmetros críticos fora dos limites`);
    }
    if (overallStatus.warnings > 0) {
      issues.push(`${overallStatus.warnings} parâmetros em nível de alerta`);
    }

    // Add feedback messages as issues
    [...feedback.microbiological, ...feedback.chemical, ...feedback.nutritional]
      .forEach(msg => {
        if (msg.includes('Exceeds') || msg.includes('Above')) {
          issues.push(msg);
        }
      });

    // Add recommendations
    recommendations.push(...feedback.recommendations);

    return {
      isCompliant: overallStatus.status === 'approved',
      issues,
      recommendations
    };
  },

  // Get validation queue
  async getValidationQueue(): Promise<{ data: ValidationQueue[] }> {
    try {
      const response = await api.get('/validations/queue');
      return { data: response.data.queue || [] };
    } catch (error) {
      console.warn('Validation queue endpoint not available, using mock data');
      return { data: [] };
    }
  },

  // Get validation metrics
  async getValidationMetrics(): Promise<{ data: ValidationMetrics }> {
    try {
      const response = await api.get('/validations/metrics');
      return { data: response.data };
    } catch (error) {
      console.warn('Validation metrics endpoint not available, using mock data');
      // Return default metrics
      return {
        data: {
          totalValidations: 0,
          automatedPercentage: 0,
          averageProcessingTime: 0,
          accuracyRate: 0,
          revalidationRate: 0,
          byStatus: {},
          byType: {},
          trendsLast30Days: []
        }
      };
    }
  },

  // Get validation feedback
  async getValidationFeedback(validationId: string): Promise<{ data: ValidationFeedback[] }> {
    try {
      const response = await api.get(`/validations/${validationId}/feedback`);
      return { data: response.data.feedback || [] };
    } catch (error) {
      console.error('Error fetching validation feedback:', error);
      return { data: [] };
    }
  },

  // Submit validation feedback
  async submitValidationFeedback(validationId: string, feedback: Omit<ValidationFeedback, 'id' | 'createdAt' | 'status'>): Promise<{ data: ValidationFeedback }> {
    const response = await api.post(`/validations/${validationId}/feedback`, feedback);
    return { data: response.data.feedback };
  },

  // Update validation data points
  async updateValidationDataPoints(validationId: string, dataPoints: any[]): Promise<{ data: Validation }> {
    const response = await api.put(`/validations/${validationId}/data-points`, { dataPoints });
    return { data: response.data.validation };
  },

  // Process validation queue item
  async processQueueItem(queueId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/validations/queue/${queueId}/process`);
      return {
        success: true,
        message: response.data.message || 'Processing started'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process queue item'
      };
    }
  },

  // Cancel validation queue item
  async cancelQueueItem(queueId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put(`/validations/queue/${queueId}/cancel`);
      return {
        success: true,
        message: response.data.message || 'Queue item cancelled'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel queue item'
      };
    }
  },

  // Retry validation queue item
  async retryQueueItem(queueId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/validations/queue/${queueId}/retry`);
      return {
        success: true,
        message: response.data.message || 'Retry scheduled'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retry queue item'
      };
    }
  },

  // Lifecycle Management Methods
  
  // Get expiring validations
  async getExpiringValidations(daysAhead: number = 30): Promise<any[]> {
    try {
      const response = await api.get(`/validations/expiring?days=${daysAhead}`);
      return response.data.validations || [];
    } catch (error) {
      console.error('Error fetching expiring validations:', error);
      return [];
    }
  },

  // Get revalidation requests
  async getRevalidationRequests(): Promise<any[]> {
    try {
      const response = await api.get('/validations/revalidation-requests');
      return response.data.requests || [];
    } catch (error) {
      console.error('Error fetching revalidation requests:', error);
      return [];
    }
  },

  // Get formula change alerts
  async getFormulaChangeAlerts(): Promise<any[]> {
    try {
      const response = await api.get('/validations/formula-change-alerts');
      return response.data.alerts || [];
    } catch (error) {
      console.error('Error fetching formula change alerts:', error);
      return [];
    }
  },

  // Get lifecycle metrics
  async getLifecycleMetrics(): Promise<any> {
    try {
      const response = await api.get('/validations/lifecycle-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching lifecycle metrics:', error);
      return {
        activeValidations: 0,
        expiringValidations: 0,
        suspendedQRCodes: 0,
        pendingRevalidations: 0,
        averageValidityPeriod: 0,
        revalidationSuccessRate: 0,
        averageRevalidationTime: 0,
        formulaChangeCount: 0
      };
    }
  },

  // Request revalidation
  async requestRevalidation(formData: FormData): Promise<any> {
    const response = await api.post('/validations/request-revalidation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Batch request revalidation
  async batchRequestRevalidation(validationIds: string[]): Promise<any> {
    const response = await api.post('/validations/batch-request-revalidation', {
      validationIds
    });
    return response.data;
  },

  // Update validation lifecycle
  async updateValidationLifecycle(validationId: string, lifecycleData: any): Promise<any> {
    const response = await api.put(`/validations/${validationId}/lifecycle`, lifecycleData);
    return response.data;
  },

  // Suspend validation
  async suspendValidation(validationId: string, reason: string): Promise<any> {
    const response = await api.put(`/validations/${validationId}/suspend`, { reason });
    return response.data;
  },

  // Reactivate validation
  async reactivateValidation(validationId: string): Promise<any> {
    const response = await api.put(`/validations/${validationId}/reactivate`);
    return response.data;
  }
};

export default validationService;
