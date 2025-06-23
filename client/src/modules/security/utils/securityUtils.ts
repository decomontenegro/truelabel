/**
 * Security Utilities
 * 
 * Funções utilitárias para segurança e auditoria
 */

import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  AuditLog,
  RiskAssessment,
  SecurityFilter
} from '../types';

class SecurityUtils {
  /**
   * Calcular score de risco baseado em eventos
   */
  calculateRiskScore(events: SecurityEvent[]): number {
    if (events.length === 0) return 0;

    const severityWeights = {
      LOW: 1,
      MEDIUM: 3,
      HIGH: 7,
      CRITICAL: 10,
    };

    const eventTypeWeights: Record<SecurityEventType, number> = {
      LOGIN_SUCCESS: 0,
      LOGIN_FAILED: 2,
      LOGIN_SUSPICIOUS: 5,
      PASSWORD_CHANGE: 1,
      PASSWORD_RESET: 2,
      ACCOUNT_LOCKED: 3,
      ACCOUNT_UNLOCKED: 1,
      PERMISSION_DENIED: 4,
      DATA_ACCESS: 2,
      DATA_EXPORT: 6,
      API_ABUSE: 8,
      BRUTE_FORCE: 9,
      SQL_INJECTION: 10,
      XSS_ATTEMPT: 8,
      CSRF_ATTEMPT: 7,
      MALWARE_DETECTED: 10,
      SUSPICIOUS_ACTIVITY: 6,
      POLICY_VIOLATION: 5,
      COMPLIANCE_ISSUE: 4,
    };

    let totalScore = 0;
    let maxPossibleScore = 0;

    events.forEach(event => {
      const severityWeight = severityWeights[event.severity];
      const eventWeight = eventTypeWeights[event.eventType];
      const eventScore = severityWeight * eventWeight;
      
      totalScore += eventScore;
      maxPossibleScore += severityWeights.CRITICAL * 10; // Max possible per event
    });

    // Normalizar para 0-100
    return Math.min(100, (totalScore / Math.max(maxPossibleScore, 1)) * 100);
  }

  /**
   * Determinar nível de risco baseado no score
   */
  getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Formatar tipo de evento para exibição
   */
  formatEventType(type: SecurityEventType): string {
    const typeMap: Record<SecurityEventType, string> = {
      LOGIN_SUCCESS: 'Login Bem-sucedido',
      LOGIN_FAILED: 'Falha no Login',
      LOGIN_SUSPICIOUS: 'Login Suspeito',
      PASSWORD_CHANGE: 'Alteração de Senha',
      PASSWORD_RESET: 'Reset de Senha',
      ACCOUNT_LOCKED: 'Conta Bloqueada',
      ACCOUNT_UNLOCKED: 'Conta Desbloqueada',
      PERMISSION_DENIED: 'Permissão Negada',
      DATA_ACCESS: 'Acesso a Dados',
      DATA_EXPORT: 'Exportação de Dados',
      API_ABUSE: 'Abuso de API',
      BRUTE_FORCE: 'Ataque de Força Bruta',
      SQL_INJECTION: 'Tentativa de SQL Injection',
      XSS_ATTEMPT: 'Tentativa de XSS',
      CSRF_ATTEMPT: 'Tentativa de CSRF',
      MALWARE_DETECTED: 'Malware Detectado',
      SUSPICIOUS_ACTIVITY: 'Atividade Suspeita',
      POLICY_VIOLATION: 'Violação de Política',
      COMPLIANCE_ISSUE: 'Problema de Compliance',
    };
    return typeMap[type] || type;
  }

  /**
   * Formatar severidade para exibição
   */
  formatSeverity(severity: SecuritySeverity): string {
    const severityMap: Record<SecuritySeverity, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return severityMap[severity];
  }

  /**
   * Obter cor baseada na severidade
   */
  getSeverityColor(severity: SecuritySeverity): {
    bg: string;
    text: string;
    border: string;
  } {
    const colorMap = {
      LOW: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
      },
      MEDIUM: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
      },
      HIGH: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300',
      },
      CRITICAL: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
      },
    };
    return colorMap[severity];
  }

  /**
   * Detectar padrões suspeitos em eventos
   */
  detectSuspiciousPatterns(events: SecurityEvent[]): Array<{
    pattern: string;
    description: string;
    severity: SecuritySeverity;
    events: SecurityEvent[];
  }> {
    const patterns = [];

    // Múltiplas falhas de login do mesmo IP
    const loginFailures = events.filter(e => e.eventType === 'LOGIN_FAILED');
    const ipFailures = this.groupEventsByIP(loginFailures);
    
    Object.entries(ipFailures).forEach(([ip, ipEvents]) => {
      if (ipEvents.length >= 5) {
        patterns.push({
          pattern: 'BRUTE_FORCE_ATTEMPT',
          description: `Múltiplas tentativas de login falharam do IP ${ip}`,
          severity: 'HIGH' as SecuritySeverity,
          events: ipEvents,
        });
      }
    });

    // Acessos de localizações incomuns
    const loginEvents = events.filter(e => 
      e.eventType === 'LOGIN_SUCCESS' && e.location
    );
    const locationChanges = this.detectLocationAnomalies(loginEvents);
    
    locationChanges.forEach(anomaly => {
      patterns.push({
        pattern: 'LOCATION_ANOMALY',
        description: anomaly.description,
        severity: 'MEDIUM' as SecuritySeverity,
        events: anomaly.events,
      });
    });

    // Atividade fora do horário normal
    const afterHoursEvents = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22; // Fora do horário 6h-22h
    });

    if (afterHoursEvents.length > 10) {
      patterns.push({
        pattern: 'AFTER_HOURS_ACTIVITY',
        description: `${afterHoursEvents.length} eventos detectados fora do horário normal`,
        severity: 'MEDIUM' as SecuritySeverity,
        events: afterHoursEvents,
      });
    }

    return patterns;
  }

  /**
   * Agrupar eventos por IP
   */
  private groupEventsByIP(events: SecurityEvent[]): Record<string, SecurityEvent[]> {
    return events.reduce((acc, event) => {
      if (event.ipAddress) {
        if (!acc[event.ipAddress]) {
          acc[event.ipAddress] = [];
        }
        acc[event.ipAddress].push(event);
      }
      return acc;
    }, {} as Record<string, SecurityEvent[]>);
  }

  /**
   * Detectar anomalias de localização
   */
  private detectLocationAnomalies(events: SecurityEvent[]): Array<{
    description: string;
    events: SecurityEvent[];
  }> {
    const anomalies = [];
    const userLocations: Record<string, SecurityEvent[]> = {};

    // Agrupar por usuário
    events.forEach(event => {
      if (event.userId && event.location) {
        if (!userLocations[event.userId]) {
          userLocations[event.userId] = [];
        }
        userLocations[event.userId].push(event);
      }
    });

    // Verificar mudanças rápidas de localização
    Object.entries(userLocations).forEach(([userId, userEvents]) => {
      const sortedEvents = userEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 1; i < sortedEvents.length; i++) {
        const prev = sortedEvents[i - 1];
        const curr = sortedEvents[i];
        
        if (prev.location && curr.location) {
          const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Se mudou de país em menos de 2 horas
          if (prev.location.country !== curr.location.country && hoursDiff < 2) {
            anomalies.push({
              description: `Usuário ${userId} mudou de ${prev.location.country} para ${curr.location.country} em ${hoursDiff.toFixed(1)} horas`,
              events: [prev, curr],
            });
          }
        }
      }
    });

    return anomalies;
  }

  /**
   * Gerar relatório de segurança
   */
  generateSecurityReport(events: SecurityEvent[], period: { start: string; end: string }): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      resolvedEvents: number;
      topEventTypes: Array<{ type: SecurityEventType; count: number }>;
    };
    riskAssessment: {
      overallRisk: number;
      riskLevel: string;
      riskFactors: string[];
    };
    recommendations: string[];
  } {
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const resolvedEvents = events.filter(e => e.resolved).length;

    // Contar eventos por tipo
    const eventTypeCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calcular risco
    const riskScore = this.calculateRiskScore(events);
    const riskLevel = this.getRiskLevel(riskScore);

    // Fatores de risco
    const riskFactors = [];
    if (criticalEvents > 0) {
      riskFactors.push(`${criticalEvents} eventos críticos detectados`);
    }
    if (resolvedEvents / totalEvents < 0.8) {
      riskFactors.push('Taxa de resolução baixa');
    }

    const suspiciousPatterns = this.detectSuspiciousPatterns(events);
    if (suspiciousPatterns.length > 0) {
      riskFactors.push(`${suspiciousPatterns.length} padrões suspeitos detectados`);
    }

    // Recomendações
    const recommendations = [];
    if (criticalEvents > 0) {
      recommendations.push('Resolver imediatamente todos os eventos críticos');
    }
    if (riskScore > 70) {
      recommendations.push('Implementar monitoramento adicional');
    }
    if (suspiciousPatterns.some(p => p.pattern === 'BRUTE_FORCE_ATTEMPT')) {
      recommendations.push('Implementar rate limiting mais rigoroso');
    }

    return {
      summary: {
        totalEvents,
        criticalEvents,
        resolvedEvents,
        topEventTypes,
      },
      riskAssessment: {
        overallRisk: riskScore,
        riskLevel,
        riskFactors,
      },
      recommendations,
    };
  }

  /**
   * Validar filtros de segurança
   */
  validateSecurityFilters(filters: SecurityFilter): string[] {
    const errors: string[] = [];

    if (filters.dateRange) {
      const startDate = parseISO(filters.dateRange.start);
      const endDate = parseISO(filters.dateRange.end);

      if (isNaN(startDate.getTime())) {
        errors.push('Data de início inválida');
      }

      if (isNaN(endDate.getTime())) {
        errors.push('Data de fim inválida');
      }

      if (isAfter(startDate, endDate)) {
        errors.push('Data de início deve ser anterior à data de fim');
      }

      // Limite de 1 ano
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (isBefore(startDate, oneYearAgo)) {
        errors.push('Período máximo permitido é de 1 ano');
      }
    }

    if (filters.page && filters.page < 1) {
      errors.push('Página deve ser maior que 0');
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      errors.push('Limite deve estar entre 1 e 100');
    }

    return errors;
  }

  /**
   * Mascarar dados sensíveis
   */
  maskSensitiveData(data: string, type: 'email' | 'ip' | 'phone' | 'generic' = 'generic'): string {
    switch (type) {
      case 'email':
        const [local, domain] = data.split('@');
        if (local && domain) {
          const maskedLocal = local.length > 2 
            ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
            : '*'.repeat(local.length);
          return `${maskedLocal}@${domain}`;
        }
        break;
      
      case 'ip':
        const parts = data.split('.');
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.***.**`;
        }
        break;
      
      case 'phone':
        if (data.length > 4) {
          return '*'.repeat(data.length - 4) + data.slice(-4);
        }
        break;
      
      default:
        if (data.length > 4) {
          return data.slice(0, 2) + '*'.repeat(data.length - 4) + data.slice(-2);
        }
    }
    
    return '*'.repeat(data.length);
  }

  /**
   * Gerar hash de fingerprint de dispositivo
   */
  generateDeviceFingerprint(userAgent: string, additionalData?: Record<string, any>): string {
    const data = {
      userAgent,
      ...additionalData,
    };
    
    // Simular hash (em produção, usar biblioteca de hash real)
    return btoa(JSON.stringify(data)).slice(0, 16);
  }
}

export const securityUtils = new SecurityUtils();
