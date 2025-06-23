/**
 * Analytics Service
 * 
 * Serviço para comunicação com a API de analytics
 */

import { api } from '@/services/api';
import type {
  AnalyticsFilter,
  DashboardMetrics,
  QRScanMetrics,
  ValidationMetrics,
  ProductMetrics,
  UserMetrics,
  RevenueMetrics,
  RealTimeMetrics,
  AnalyticsReport,
  AnalyticsEvent
} from '../types';

class AnalyticsService {
  private readonly baseUrl = '/analytics';

  /**
   * Buscar métricas do dashboard
   */
  async getDashboardMetrics(filters: AnalyticsFilter): Promise<DashboardMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/dashboard?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas de QR Code
   */
  async getQRScanMetrics(filters: AnalyticsFilter): Promise<QRScanMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/qr-scans?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas de validações
   */
  async getValidationMetrics(filters: AnalyticsFilter): Promise<ValidationMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/validations?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas de produtos
   */
  async getProductMetrics(filters: AnalyticsFilter): Promise<ProductMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/products?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas de usuários
   */
  async getUserMetrics(filters: AnalyticsFilter): Promise<UserMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/users?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas de receita
   */
  async getRevenueMetrics(filters: AnalyticsFilter): Promise<RevenueMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/revenue?${params}`);
    return response.data;
  }

  /**
   * Buscar métricas em tempo real
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const response = await api.get(`${this.baseUrl}/real-time`);
    return response.data;
  }

  /**
   * Buscar analytics de produto específico
   */
  async getProductAnalytics(productId: string, filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/products/${productId}?${params}`);
    return response.data;
  }

  /**
   * Buscar analytics de QR Code específico
   */
  async getQRCodeAnalytics(qrCode: string, filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/qr-codes/${qrCode}?${params}`);
    return response.data;
  }

  /**
   * Buscar analytics de laboratório específico
   */
  async getLaboratoryAnalytics(labId: string, filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/laboratories/${labId}?${params}`);
    return response.data;
  }

  /**
   * Buscar funil de conversão
   */
  async getConversionFunnel(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/funnel?${params}`);
    return response.data;
  }

  /**
   * Buscar análise de coorte
   */
  async getCohortAnalysis(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/cohort?${params}`);
    return response.data;
  }

  /**
   * Buscar análise de retenção
   */
  async getRetentionAnalysis(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/retention?${params}`);
    return response.data;
  }

  /**
   * Buscar análise geográfica
   */
  async getGeographicAnalysis(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/geographic?${params}`);
    return response.data;
  }

  /**
   * Buscar análise de dispositivos
   */
  async getDeviceAnalysis(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/devices?${params}`);
    return response.data;
  }

  /**
   * Buscar análise de performance
   */
  async getPerformanceAnalysis(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/performance?${params}`);
    return response.data;
  }

  /**
   * Rastrear evento personalizado
   */
  async trackEvent(event: {
    eventType: string;
    entityType: string;
    entityId: string;
    data?: Record<string, any>;
  }): Promise<AnalyticsEvent> {
    const response = await api.post(`${this.baseUrl}/events`, event);
    return response.data;
  }

  /**
   * Buscar eventos de analytics
   */
  async getEvents(filters: {
    eventType?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    events: AnalyticsEvent[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/events?${params}`);
    return response.data;
  }

  /**
   * Exportar relatório
   */
  async exportReport(
    type: string,
    filters: AnalyticsFilter,
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  ): Promise<Blob> {
    const params = this.buildQueryParams(filters);
    params.append('format', format);
    
    const response = await api.get(`${this.baseUrl}/export/${type}?${params}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  /**
   * Buscar relatórios salvos
   */
  async getSavedReports(): Promise<AnalyticsReport[]> {
    const response = await api.get(`${this.baseUrl}/reports`);
    return response.data;
  }

  /**
   * Salvar relatório
   */
  async saveReport(report: {
    name: string;
    description: string;
    type: string;
    filters: AnalyticsFilter;
  }): Promise<AnalyticsReport> {
    const response = await api.post(`${this.baseUrl}/reports`, report);
    return response.data;
  }

  /**
   * Deletar relatório salvo
   */
  async deleteReport(reportId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/reports/${reportId}`);
  }

  /**
   * Buscar insights automáticos
   */
  async getInsights(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/insights?${params}`);
    return response.data;
  }

  /**
   * Buscar previsões
   */
  async getForecast(
    metric: string,
    filters: AnalyticsFilter,
    periods: number = 30
  ): Promise<any> {
    const params = this.buildQueryParams(filters);
    params.append('metric', metric);
    params.append('periods', periods.toString());
    
    const response = await api.get(`${this.baseUrl}/forecast?${params}`);
    return response.data;
  }

  /**
   * Buscar anomalias
   */
  async getAnomalies(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/anomalies?${params}`);
    return response.data;
  }

  /**
   * Buscar benchmarks
   */
  async getBenchmarks(filters: AnalyticsFilter): Promise<any> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/benchmarks?${params}`);
    return response.data;
  }

  /**
   * Construir parâmetros de query
   */
  private buildQueryParams(filters: AnalyticsFilter): URLSearchParams {
    const params = new URLSearchParams();
    
    params.append('startDate', filters.dateRange.start);
    params.append('endDate', filters.dateRange.end);
    params.append('granularity', filters.granularity);
    
    if (filters.userRole?.length) {
      params.append('userRole', filters.userRole.join(','));
    }
    if (filters.productCategory?.length) {
      params.append('productCategory', filters.productCategory.join(','));
    }
    if (filters.brand?.length) {
      params.append('brand', filters.brand.join(','));
    }
    if (filters.location?.length) {
      params.append('location', filters.location.join(','));
    }
    if (filters.device?.length) {
      params.append('device', filters.device.join(','));
    }
    if (filters.validationType?.length) {
      params.append('validationType', filters.validationType.join(','));
    }
    
    return params;
  }
}

export const analyticsService = new AnalyticsService();
