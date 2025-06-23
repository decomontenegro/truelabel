import api from './api';
import { Report, PaginatedResponse } from '@/types';

interface ReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  laboratoryId?: string;
  productId?: string;
  status?: 'verified' | 'pending';
}

interface CreateReportData {
  productId: string;
  laboratoryId: string;
  analysisType: string;
  results?: string;
  file: File;
}

interface UpdateReportResultsData {
  results: string | object;
  isVerified?: boolean;
}

export const reportService = {
  // Listar relatórios
  async getReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/reports?${params.toString()}`);
    
    // Adaptar resposta da API real
    const reports = response.data.reports || [];
    return {
      data: reports,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: reports.length,
        totalPages: 1
      },
    };
  },

  // Obter relatório específico
  async getReport(id: string): Promise<{ report: Report }> {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // Criar relatório (upload)
  async createReport(data: CreateReportData): Promise<{ report: Report; message: string }> {
    const formData = new FormData();
    
    // Adicionar dados do relatório
    formData.append('productId', data.productId);
    formData.append('laboratoryId', data.laboratoryId);
    formData.append('analysisType', data.analysisType);
    
    if (data.results) {
      formData.append('results', data.results);
    }
    
    // Adicionar arquivo
    formData.append('report', data.file);

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Atualizar resultados do relatório
  async updateReportResults(id: string, data: UpdateReportResultsData): Promise<{ report: Report; message: string }> {
    const payload = {
      results: typeof data.results === 'string' ? data.results : JSON.stringify(data.results),
      isVerified: data.isVerified
    };

    const response = await api.put(`/reports/${id}/results`, payload);
    return response.data;
  },

  // Download do arquivo do relatório
  async downloadReport(id: string): Promise<Blob> {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    
    return response.data;
  },

  // Deletar relatório
  async deleteReport(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  // Obter relatórios por produto
  async getReportsByProduct(productId: string): Promise<Report[]> {
    const response = await this.getReports({ productId, limit: 100 });
    return response.data;
  },

  // Obter relatórios por laboratório
  async getReportsByLaboratory(laboratoryId: string): Promise<Report[]> {
    const response = await this.getReports({ laboratoryId, limit: 100 });
    return response.data;
  },

  // Obter relatórios pendentes de verificação
  async getPendingReports(): Promise<Report[]> {
    const response = await this.getReports({ status: 'pending', limit: 100 });
    return response.data;
  },

  // Obter relatórios verificados
  async getVerifiedReports(): Promise<Report[]> {
    const response = await this.getReports({ status: 'verified', limit: 100 });
    return response.data;
  },

  // Validar arquivo de relatório
  validateReportFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!file) {
      errors.push('Arquivo é obrigatório');
      return { isValid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push('Arquivo deve ter no máximo 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validar dados do relatório
  validateReportData(data: Omit<CreateReportData, 'file'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.productId) {
      errors.push('Produto é obrigatório');
    }

    if (!data.laboratoryId) {
      errors.push('Laboratório é obrigatório');
    }

    if (!data.analysisType || data.analysisType.trim().length < 2) {
      errors.push('Tipo de análise deve ter pelo menos 2 caracteres');
    }

    if (data.results) {
      try {
        // Tentar parsear como JSON se for string
        if (typeof data.results === 'string') {
          JSON.parse(data.results);
        }
      } catch (error) {
        // Se não for JSON válido, aceitar como string simples
        // Não é erro, apenas não é JSON estruturado
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Obter tipos de análise comuns
  getCommonAnalysisTypes(): string[] {
    return [
      'Análise Nutricional',
      'Análise Microbiológica',
      'Análise de Glúten',
      'Análise de Proteínas',
      'Análise de Lactose',
      'Análise de Alérgenos',
      'Análise de Vitaminas',
      'Análise de Minerais',
      'Análise de Probióticos',
      'Análise de Contaminantes',
      'Análise Físico-Química',
      'Análise de Pesticidas',
      'Análise de Metais Pesados',
      'Análise de Conservantes',
      'Análise de Corantes',
      'Outros'
    ];
  },

  // Formatar tamanho do arquivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Obter extensão do arquivo
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // Verificar se arquivo é PDF
  isPDF(file: File): boolean {
    return file.type === 'application/pdf';
  },

  // Verificar se arquivo é imagem
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  },

  // Gerar nome único para arquivo
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = this.getFileExtension(originalName);
    
    return `report-${timestamp}-${random}.${extension}`;
  },

  // Processar resultados de análise
  parseAnalysisResults(results: string): any {
    try {
      return JSON.parse(results);
    } catch (error) {
      // Se não for JSON, retornar como texto simples
      return { text: results };
    }
  },

  // Formatar resultados para exibição
  formatResultsForDisplay(results: string): string {
    try {
      const parsed = JSON.parse(results);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return results;
    }
  }
};

export default reportService;
