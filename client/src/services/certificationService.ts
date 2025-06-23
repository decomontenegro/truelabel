import api, { createFormData } from './api';
import { 
  Certification, 
  ProductCertification, 
  CertificationFilters,
  CreateCertificationData,
  AddProductCertificationData,
  CertificationVerificationResult,
  CertificationStatistics,
  CertificationTimeline,
  CertificationBadge,
  BadgeGenerationOptions,
  BulkCertificationUpload,
  BulkOperationResult,
  CertificationAlert
} from '@/types/certifications';
import { PaginatedResponse } from '@/types';
import { fallbackService, fallbackData } from './fallbackService';

export const certificationService = {
  // Get certifications with filters
  async getCertifications(filters: CertificationFilters = {}): Promise<PaginatedResponse<Certification>> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/certifications?${params.toString()}`);

      return {
        data: response.data.certifications || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error: any) {
      if (fallbackService.shouldUseFallback(error)) {
        fallbackService.logFallbackUsage('certificationService', 'getCertifications', error);
        await fallbackService.simulateDelay();

        let filteredCertifications = [...fallbackData.certifications];

        // Apply filters to fallback data
        if (filters.status) {
          filteredCertifications = filteredCertifications.filter(c => c.status === filters.status);
        }
        if (filters.type) {
          filteredCertifications = filteredCertifications.filter(c => c.type === filters.type);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCertifications = filteredCertifications.slice(startIndex, endIndex);

        return {
          data: paginatedCertifications,
          pagination: {
            page,
            limit,
            total: filteredCertifications.length,
            totalPages: Math.ceil(filteredCertifications.length / limit)
          }
        };
      }
      throw error;
    }
  },

  // Get certification by ID
  async getCertificationById(id: string): Promise<Certification> {
    const response = await api.get(`/certifications/${id}`);
    return response.data.certification;
  },

  // Create new certification
  async createCertification(data: CreateCertificationData): Promise<{ certification: Certification; message: string }> {
    try {
      const response = await api.post('/certifications', data);
      return response.data;
    } catch (error: any) {
      if (fallbackService.shouldUseFallback(error)) {
        fallbackService.logFallbackUsage('certificationService', 'createCertification', error);
        await fallbackService.simulateDelay();

        // Create mock certification
        const mockCertification: Certification = {
          id: `cert-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          issuer: data.issuer,
          number: data.number,
          type: data.type,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate || '',
          status: 'ACTIVE',
          verificationMethod: data.verificationMethod || 'MANUAL',
          verificationUrl: data.verificationUrl || '',
          scope: data.scope || '',
          standards: data.standards || [],
          documentUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Store in localStorage for demo purposes
        const existingCertifications = JSON.parse(localStorage.getItem('mockCertifications') || '[]');
        existingCertifications.push(mockCertification);
        localStorage.setItem('mockCertifications', JSON.stringify(existingCertifications));

        return {
          certification: mockCertification,
          message: 'Certificação criada com sucesso (modo demonstração)'
        };
      }
      throw error;
    }
  },

  // Update certification
  async updateCertification(id: string, data: Partial<CreateCertificationData>): Promise<{ certification: Certification; message: string }> {
    const response = await api.put(`/certifications/${id}`, data);
    return response.data;
  },

  // Delete certification
  async deleteCertification(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/certifications/${id}`);
    return response.data;
  },

  // Get product certifications
  async getProductCertifications(productId: string): Promise<ProductCertification[]> {
    const response = await api.get(`/products/${productId}/certifications`);
    return response.data.certifications || [];
  },

  // Add certification to product
  async addProductCertification(data: AddProductCertificationData): Promise<{ productCertification: ProductCertification; message: string }> {
    try {
      const response = await api.post('/product-certifications', data);
      return response.data;
    } catch (error: any) {
      if (fallbackService.shouldUseFallback(error)) {
        fallbackService.logFallbackUsage('certificationService', 'addProductCertification', error);
        await fallbackService.simulateDelay();

        // Create mock product certification
        const mockProductCertification: ProductCertification = {
          id: `prod-cert-${Date.now()}`,
          productId: data.productId,
          certificationId: data.certificationId,
          certificateNumber: data.certificateNumber,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate || '',
          status: 'ACTIVE',
          verifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Store in localStorage for demo purposes
        const existingProductCerts = JSON.parse(localStorage.getItem('mockProductCertifications') || '[]');
        existingProductCerts.push(mockProductCertification);
        localStorage.setItem('mockProductCertifications', JSON.stringify(existingProductCerts));

        return {
          productCertification: mockProductCertification,
          message: 'Certificação adicionada ao produto com sucesso (modo demonstração)'
        };
      }
      throw error;
    }
  },

  // Remove certification from product
  async removeProductCertification(productCertificationId: string): Promise<{ message: string }> {
    const response = await api.delete(`/product-certifications/${productCertificationId}`);
    return response.data;
  },

  // Update product certification
  async updateProductCertification(id: string, data: Partial<AddProductCertificationData>): Promise<{ productCertification: ProductCertification; message: string }> {
    const response = await api.put(`/product-certifications/${id}`, data);
    return response.data;
  },

  // Verify certification authenticity
  async verifyCertification(certificationId: string, certificateNumber?: string): Promise<CertificationVerificationResult> {
    const response = await api.post(`/certifications/${certificationId}/verify`, {
      certificateNumber
    });
    return response.data;
  },

  // Get certification statistics
  async getCertificationStatistics(filters?: { productId?: string; brandId?: string }): Promise<CertificationStatistics> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await api.get(`/certifications/statistics?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      // Return default statistics if API fails
      console.error('Error fetching certification statistics:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0,
        byType: {},
        byIssuer: {},
        upcomingExpirations: []
      };
    }
  },

  // Get certification timeline
  async getCertificationTimeline(certificationId: string): Promise<CertificationTimeline> {
    const response = await api.get(`/certifications/${certificationId}/timeline`);
    return response.data;
  },

  // Upload certificate document
  async uploadCertificateDocument(certificationId: string, file: File): Promise<{ documentUrl: string; message: string }> {
    try {
      const formData = createFormData({ file });

      const response = await api.post(`/certifications/${certificationId}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      if (fallbackService.shouldUseFallback(error)) {
        fallbackService.logFallbackUsage('certificationService', 'uploadCertificateDocument', error);
        await fallbackService.simulateDelay();

        // Mock document upload
        const mockDocumentUrl = `https://mock-storage.com/certifications/${certificationId}/${file.name}`;

        return {
          documentUrl: mockDocumentUrl,
          message: 'Documento enviado com sucesso (modo demonstração)'
        };
      }
      throw error;
    }
  },

  // Generate certification badge
  async generateBadge(options: BadgeGenerationOptions): Promise<{ badge: CertificationBadge; message: string }> {
    const response = await api.post('/certifications/badges/generate', options);
    return response.data;
  },

  // Get certification badges
  async getCertificationBadges(certificationId: string): Promise<CertificationBadge[]> {
    const response = await api.get(`/certifications/${certificationId}/badges`);
    return response.data.badges || [];
  },

  // Bulk upload certifications
  async bulkUploadCertifications(data: BulkCertificationUpload): Promise<BulkOperationResult> {
    const formData = createFormData({
      file: data.file,
      mapping: JSON.stringify(data.mapping)
    });

    const response = await api.post('/certifications/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get certification alerts
  async getCertificationAlerts(filters?: { productId?: string; isRead?: boolean }): Promise<CertificationAlert[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }

      const response = await api.get(`/certifications/alerts?${params.toString()}`);
      return response.data.alerts || [];
    } catch (error: any) {
      // Return empty array if API fails
      console.error('Error fetching certification alerts:', error);
      return [];
    }
  },

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<{ message: string }> {
    const response = await api.put(`/certifications/alerts/${alertId}/read`);
    return response.data;
  },

  // Configure alert settings
  async configureAlertSettings(settings: {
    expirationWarningDays: number;
    emailNotifications: boolean;
    dashboardNotifications: boolean;
  }): Promise<{ message: string }> {
    const response = await api.put('/certifications/alerts/settings', settings);
    return response.data;
  },

  // Helper functions
  isCertificationExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
  },

  getCertificationStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'EXPIRED': return 'red';
      case 'PENDING': return 'yellow';
      case 'SUSPENDED': return 'orange';
      case 'REVOKED': return 'red';
      default: return 'gray';
    }
  },

  getCertificationStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'EXPIRED': return 'Expirado';
      case 'PENDING': return 'Pendente';
      case 'SUSPENDED': return 'Suspenso';
      case 'REVOKED': return 'Revogado';
      default: return status;
    }
  },

  getCertificationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ISO': 'ISO',
      'HACCP': 'HACCP',
      'ORGANIC': 'Orgânico',
      'FAIRTRADE': 'Comércio Justo',
      'KOSHER': 'Kosher',
      'HALAL': 'Halal',
      'VEGAN': 'Vegano',
      'NON_GMO': 'Não-OGM',
      'GLUTEN_FREE': 'Sem Glúten',
      'RAINFOREST_ALLIANCE': 'Rainforest Alliance',
      'BRC': 'BRC',
      'IFS': 'IFS',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  },

  formatExpiryDate(date: string): string {
    if (!date) {
      return 'Data não informada';
    }

    const expiryDate = new Date(date);

    // Verificar se a data é válida
    if (isNaN(expiryDate.getTime())) {
      return 'Data inválida';
    }

    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expirado há ${Math.abs(diffDays)} dias`;
    } else if (diffDays === 0) {
      return 'Expira hoje';
    } else if (diffDays === 1) {
      return 'Expira amanhã';
    } else if (diffDays <= 30) {
      return `Expira em ${diffDays} dias`;
    } else {
      return new Intl.DateTimeFormat('pt-BR').format(expiryDate);
    }
  },

  getDaysUntilExpiry(expiryDate: string): number {
    if (!expiryDate) {
      return 0;
    }

    const today = new Date();
    const expiry = new Date(expiryDate);

    // Verificar se a data é válida
    if (isNaN(expiry.getTime())) {
      return 0;
    }

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};