/**
 * Security Service
 * 
 * Serviço para comunicação com a API de segurança
 */

import { api } from '@/services/api';
import type {
  SecurityEvent,
  SecurityFilter,
  SecurityMetrics,
  AuditLog,
  SecurityPolicy,
  RiskAssessment,
  ThreatDetection,
  ComplianceReport,
  UserSession,
  SecurityConfiguration
} from '../types';

class SecurityService {
  private readonly baseUrl = '/security';

  /**
   * Buscar eventos de segurança
   */
  async getSecurityEvents(filters: SecurityFilter = {}): Promise<{
    events: SecurityEvent[];
    total: number;
    hasMore: boolean;
  }> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`${this.baseUrl}/events?${params}`);
    return response.data;
  }

  /**
   * Buscar evento específico
   */
  async getSecurityEvent(eventId: string): Promise<SecurityEvent> {
    const response = await api.get(`${this.baseUrl}/events/${eventId}`);
    return response.data;
  }

  /**
   * Resolver evento de segurança
   */
  async resolveSecurityEvent(eventId: string, notes?: string): Promise<SecurityEvent> {
    const response = await api.patch(`${this.baseUrl}/events/${eventId}/resolve`, {
      notes,
    });
    return response.data;
  }

  /**
   * Criar evento de segurança
   */
  async createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityEvent> {
    const response = await api.post(`${this.baseUrl}/events`, event);
    return response.data;
  }

  /**
   * Buscar métricas de segurança
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const response = await api.get(`${this.baseUrl}/metrics`);
    return response.data;
  }

  /**
   * Buscar logs de auditoria
   */
  async getAuditLogs(filters: any = {}): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`${this.baseUrl}/audit-logs?${params}`);
    return response.data;
  }

  /**
   * Buscar log de auditoria específico
   */
  async getAuditLog(logId: string): Promise<AuditLog> {
    const response = await api.get(`${this.baseUrl}/audit-logs/${logId}`);
    return response.data;
  }

  /**
   * Buscar políticas de segurança
   */
  async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    const response = await api.get(`${this.baseUrl}/policies`);
    return response.data;
  }

  /**
   * Criar política de segurança
   */
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const response = await api.post(`${this.baseUrl}/policies`, policy);
    return response.data;
  }

  /**
   * Atualizar política de segurança
   */
  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    const response = await api.patch(`${this.baseUrl}/policies/${policyId}`, updates);
    return response.data;
  }

  /**
   * Deletar política de segurança
   */
  async deleteSecurityPolicy(policyId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/policies/${policyId}`);
  }

  /**
   * Buscar avaliação de risco
   */
  async getRiskAssessment(userId?: string): Promise<RiskAssessment> {
    const url = userId 
      ? `${this.baseUrl}/risk-assessment/${userId}`
      : `${this.baseUrl}/risk-assessment`;
    
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Executar avaliação de risco
   */
  async performRiskAssessment(userId: string): Promise<RiskAssessment> {
    const response = await api.post(`${this.baseUrl}/risk-assessment`, { userId });
    return response.data;
  }

  /**
   * Buscar detecções de ameaças
   */
  async getThreatDetections(): Promise<ThreatDetection[]> {
    const response = await api.get(`${this.baseUrl}/threats`);
    return response.data;
  }

  /**
   * Buscar detecção específica
   */
  async getThreatDetection(threatId: string): Promise<ThreatDetection> {
    const response = await api.get(`${this.baseUrl}/threats/${threatId}`);
    return response.data;
  }

  /**
   * Mitigar ameaça
   */
  async mitigateThreat(threatId: string, steps: string[]): Promise<ThreatDetection> {
    const response = await api.patch(`${this.baseUrl}/threats/${threatId}/mitigate`, {
      mitigationSteps: steps,
    });
    return response.data;
  }

  /**
   * Buscar relatórios de compliance
   */
  async getComplianceReports(): Promise<ComplianceReport[]> {
    const response = await api.get(`${this.baseUrl}/compliance/reports`);
    return response.data;
  }

  /**
   * Gerar relatório de compliance
   */
  async generateComplianceReport(
    type: string,
    period: { start: string; end: string }
  ): Promise<ComplianceReport> {
    const response = await api.post(`${this.baseUrl}/compliance/reports`, {
      type,
      period,
    });
    return response.data;
  }

  /**
   * Buscar sessões de usuário
   */
  async getUserSessions(userId?: string): Promise<UserSession[]> {
    const url = userId 
      ? `${this.baseUrl}/sessions/user/${userId}`
      : `${this.baseUrl}/sessions`;
    
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Terminar sessão
   */
  async terminateSession(sessionId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/sessions/${sessionId}`);
  }

  /**
   * Buscar configurações de segurança
   */
  async getSecurityConfiguration(): Promise<SecurityConfiguration> {
    const response = await api.get(`${this.baseUrl}/configuration`);
    return response.data;
  }

  /**
   * Atualizar configurações de segurança
   */
  async updateSecurityConfiguration(config: Partial<SecurityConfiguration>): Promise<SecurityConfiguration> {
    const response = await api.patch(`${this.baseUrl}/configuration`, config);
    return response.data;
  }

  /**
   * Verificar integridade do sistema
   */
  async checkSystemIntegrity(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    checks: Array<{
      name: string;
      status: 'PASS' | 'FAIL' | 'WARNING';
      message: string;
    }>;
  }> {
    const response = await api.get(`${this.baseUrl}/integrity-check`);
    return response.data;
  }

  /**
   * Executar scan de vulnerabilidades
   */
  async runVulnerabilityScan(): Promise<{
    scanId: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    vulnerabilities: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      type: string;
      description: string;
      recommendation: string;
    }>;
  }> {
    const response = await api.post(`${this.baseUrl}/vulnerability-scan`);
    return response.data;
  }

  /**
   * Buscar histórico de incidentes
   */
  async getIncidentHistory(filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/incidents?${params}`);
    return response.data;
  }

  /**
   * Exportar dados de segurança
   */
  async exportSecurityData(
    type: 'events' | 'audit-logs' | 'compliance',
    filters: any,
    format: 'CSV' | 'JSON' | 'PDF'
  ): Promise<Blob> {
    const params = this.buildQueryParams(filters);
    params.append('format', format);
    
    const response = await api.get(`${this.baseUrl}/export/${type}?${params}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  /**
   * Testar configurações de segurança
   */
  async testSecurityConfiguration(): Promise<{
    results: Array<{
      test: string;
      status: 'PASS' | 'FAIL';
      message: string;
    }>;
    overallStatus: 'PASS' | 'FAIL';
  }> {
    const response = await api.post(`${this.baseUrl}/test-configuration`);
    return response.data;
  }

  /**
   * Construir parâmetros de query
   */
  private buildQueryParams(filters: SecurityFilter): URLSearchParams {
    const params = new URLSearchParams();
    
    if (filters.eventTypes?.length) {
      params.append('eventTypes', filters.eventTypes.join(','));
    }
    if (filters.severities?.length) {
      params.append('severities', filters.severities.join(','));
    }
    if (filters.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }
    if (filters.userId) {
      params.append('userId', filters.userId);
    }
    if (filters.ipAddress) {
      params.append('ipAddress', filters.ipAddress);
    }
    if (filters.resolved !== undefined) {
      params.append('resolved', filters.resolved.toString());
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }
    
    return params;
  }
}

export const securityService = new SecurityService();
