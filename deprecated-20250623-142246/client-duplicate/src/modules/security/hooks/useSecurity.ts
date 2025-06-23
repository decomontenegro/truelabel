/**
 * Security Hooks
 * 
 * Custom hooks para gerenciar segurança e auditoria
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { securityService } from '../services/securityService';
import { useAuthStore } from '@/stores/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import type {
  SecurityEvent,
  SecurityFilter,
  SecurityMetrics,
  AuditLog,
  SecurityPolicy,
  RiskAssessment,
  ThreatDetection,
  ComplianceReport,
  UserSession
} from '../types';

export const SECURITY_QUERY_KEYS = {
  all: ['security'] as const,
  events: () => [...SECURITY_QUERY_KEYS.all, 'events'] as const,
  eventsList: (filters: SecurityFilter) => [...SECURITY_QUERY_KEYS.events(), filters] as const,
  metrics: () => [...SECURITY_QUERY_KEYS.all, 'metrics'] as const,
  auditLogs: () => [...SECURITY_QUERY_KEYS.all, 'audit-logs'] as const,
  policies: () => [...SECURITY_QUERY_KEYS.all, 'policies'] as const,
  risks: () => [...SECURITY_QUERY_KEYS.all, 'risks'] as const,
  threats: () => [...SECURITY_QUERY_KEYS.all, 'threats'] as const,
  compliance: () => [...SECURITY_QUERY_KEYS.all, 'compliance'] as const,
  sessions: () => [...SECURITY_QUERY_KEYS.all, 'sessions'] as const,
};

/**
 * Hook principal para eventos de segurança
 */
export function useSecurityEvents(filters: SecurityFilter = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: events,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: SECURITY_QUERY_KEYS.eventsList(filters),
    queryFn: () => securityService.getSecurityEvents(filters),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY'),
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para resolver evento
  const resolveEventMutation = useMutation({
    mutationFn: (params: { eventId: string; notes?: string }) =>
      securityService.resolveSecurityEvent(params.eventId, params.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.events() });
      toast.success('Evento resolvido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao resolver evento');
    },
  });

  const resolveEvent = useCallback((eventId: string, notes?: string) => {
    resolveEventMutation.mutate({ eventId, notes });
  }, [resolveEventMutation]);

  return {
    events: events?.events || [],
    total: events?.total || 0,
    isLoading,
    error,
    refetch,
    resolveEvent,
    isResolving: resolveEventMutation.isPending,
  };
}

/**
 * Hook para métricas de segurança
 */
export function useSecurityMetrics() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.metrics(),
    queryFn: () => securityService.getSecurityMetrics(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para logs de auditoria
 */
export function useAuditLogs(filters: any = {}) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...SECURITY_QUERY_KEYS.auditLogs(), filters],
    queryFn: () => securityService.getAuditLogs(filters),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY'),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para políticas de segurança
 */
export function useSecurityPolicies() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: policies, isLoading } = useQuery({
    queryKey: SECURITY_QUERY_KEYS.policies(),
    queryFn: () => securityService.getSecurityPolicies(),
    enabled: !!user && user.role === 'ADMIN',
  });

  const updatePolicyMutation = useMutation({
    mutationFn: (params: { policyId: string; updates: Partial<SecurityPolicy> }) =>
      securityService.updateSecurityPolicy(params.policyId, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.policies() });
      toast.success('Política atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar política');
    },
  });

  const createPolicyMutation = useMutation({
    mutationFn: (policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>) =>
      securityService.createSecurityPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.policies() });
      toast.success('Política criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar política');
    },
  });

  return {
    policies: policies || [],
    isLoading,
    updatePolicy: updatePolicyMutation.mutate,
    createPolicy: createPolicyMutation.mutate,
    isUpdating: updatePolicyMutation.isPending,
    isCreating: createPolicyMutation.isPending,
  };
}

/**
 * Hook para avaliação de riscos
 */
export function useRiskAssessment(userId?: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...SECURITY_QUERY_KEYS.risks(), userId],
    queryFn: () => securityService.getRiskAssessment(userId),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY') && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para detecção de ameaças
 */
export function useThreatDetection() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: threats, isLoading } = useQuery({
    queryKey: SECURITY_QUERY_KEYS.threats(),
    queryFn: () => securityService.getThreatDetections(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY'),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // 1 minuto
  });

  const mitigateThreatMutation = useMutation({
    mutationFn: (params: { threatId: string; steps: string[] }) =>
      securityService.mitigateThreat(params.threatId, params.steps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.threats() });
      toast.success('Ameaça mitigada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao mitigar ameaça');
    },
  });

  return {
    threats: threats || [],
    isLoading,
    mitigateThreat: mitigateThreatMutation.mutate,
    isMitigating: mitigateThreatMutation.isPending,
  };
}

/**
 * Hook para relatórios de compliance
 */
export function useComplianceReports() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: SECURITY_QUERY_KEYS.compliance(),
    queryFn: () => securityService.getComplianceReports(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY'),
  });

  const generateReportMutation = useMutation({
    mutationFn: (params: { type: string; period: { start: string; end: string } }) =>
      securityService.generateComplianceReport(params.type, params.period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.compliance() });
      toast.success('Relatório gerado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao gerar relatório');
    },
  });

  return {
    reports: reports || [],
    isLoading,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de sessões
 */
export function useUserSessions(userId?: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: [...SECURITY_QUERY_KEYS.sessions(), userId],
    queryFn: () => securityService.getUserSessions(userId),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SECURITY' || user.id === userId),
  });

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => securityService.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.sessions() });
      toast.success('Sessão terminada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao terminar sessão');
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    terminateSession: terminateSessionMutation.mutate,
    isTerminating: terminateSessionMutation.isPending,
  };
}

/**
 * Hook para eventos de segurança em tempo real
 */
export function useRealTimeSecurityEvents() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !user || (user.role !== 'ADMIN' && user.role !== 'SECURITY')) {
      return;
    }

    const handleSecurityEvent = (event: SecurityEvent) => {
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.events() });
      
      // Adicionar aos eventos recentes
      setRecentEvents(prev => [event, ...prev.slice(0, 9)]);
      
      // Mostrar notificação para eventos críticos
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        toast.error(`Evento de segurança: ${event.description}`, {
          duration: 10000,
        });
      }
    };

    socket.on('security:event', handleSecurityEvent);

    return () => {
      socket.off('security:event', handleSecurityEvent);
    };
  }, [socket, isConnected, user, queryClient]);

  return {
    recentEvents,
    isConnected,
    clearRecentEvents: () => setRecentEvents([]),
  };
}

/**
 * Hook para filtros de segurança
 */
export function useSecurityFilters(initialFilters?: Partial<SecurityFilter>) {
  const [filters, setFilters] = useState<SecurityFilter>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const updateFilters = useCallback((newFilters: Partial<SecurityFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      page: 1,
      limit: 20,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
