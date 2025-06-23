/**
 * Analytics Hooks
 * 
 * Custom hooks para gerenciar analytics no frontend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '@/stores/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import type {
  AnalyticsFilter,
  DashboardMetrics,
  QRScanMetrics,
  ValidationMetrics,
  ProductMetrics,
  UserMetrics,
  RevenueMetrics,
  RealTimeMetrics,
  AnalyticsReport
} from '../types';

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  dashboard: () => [...ANALYTICS_QUERY_KEYS.all, 'dashboard'] as const,
  qrScans: (filters: AnalyticsFilter) => [...ANALYTICS_QUERY_KEYS.all, 'qr-scans', filters] as const,
  validations: (filters: AnalyticsFilter) => [...ANALYTICS_QUERY_KEYS.all, 'validations', filters] as const,
  products: (filters: AnalyticsFilter) => [...ANALYTICS_QUERY_KEYS.all, 'products', filters] as const,
  users: (filters: AnalyticsFilter) => [...ANALYTICS_QUERY_KEYS.all, 'users', filters] as const,
  revenue: (filters: AnalyticsFilter) => [...ANALYTICS_QUERY_KEYS.all, 'revenue', filters] as const,
  realTime: () => [...ANALYTICS_QUERY_KEYS.all, 'real-time'] as const,
  reports: () => [...ANALYTICS_QUERY_KEYS.all, 'reports'] as const,
};

/**
 * Hook principal para analytics do dashboard
 */
export function useDashboardAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.dashboard(),
    queryFn: () => analyticsService.getDashboardMetrics(filters),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para analytics de QR Code
 */
export function useQRAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.qrScans(filters),
    queryFn: () => analyticsService.getQRScanMetrics(filters),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para analytics de validações
 */
export function useValidationAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.validations(filters),
    queryFn: () => analyticsService.getValidationMetrics(filters),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para analytics de produtos
 */
export function useProductAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.products(filters),
    queryFn: () => analyticsService.getProductMetrics(filters),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para analytics de usuários
 */
export function useUserAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.users(filters),
    queryFn: () => analyticsService.getUserMetrics(filters),
    enabled: !!user && user.role === 'ADMIN',
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para analytics de receita
 */
export function useRevenueAnalytics(filters: AnalyticsFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.revenue(filters),
    queryFn: () => analyticsService.getRevenueMetrics(filters),
    enabled: !!user && user.role === 'ADMIN',
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Hook para analytics em tempo real
 */
export function useRealTimeAnalytics() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  const { data: realTimeData, refetch } = useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.realTime(),
    queryFn: () => analyticsService.getRealTimeMetrics(),
    enabled: !!user,
    refetchInterval: 30 * 1000, // 30 segundos
  });

  // Escutar eventos em tempo real
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleAnalyticsUpdate = (data: any) => {
      queryClient.setQueryData(ANALYTICS_QUERY_KEYS.realTime(), data);
    };

    socket.on('analytics:update', handleAnalyticsUpdate);

    return () => {
      socket.off('analytics:update', handleAnalyticsUpdate);
    };
  }, [socket, isConnected, user, queryClient]);

  return {
    data: realTimeData,
    refetch,
    isConnected,
  };
}

/**
 * Hook para filtros de analytics
 */
export function useAnalyticsFilters(initialFilters?: Partial<AnalyticsFilter>) {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    granularity: 'day',
    ...initialFilters,
  });

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      granularity: 'day',
    });
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    updateFilters({
      dateRange: { start, end }
    });
  }, [updateFilters]);

  const setGranularity = useCallback((granularity: AnalyticsFilter['granularity']) => {
    updateFilters({ granularity });
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    setDateRange,
    setGranularity,
  };
}

/**
 * Hook para exportar relatórios
 */
export function useAnalyticsExport() {
  const queryClient = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: (params: {
      type: string;
      filters: AnalyticsFilter;
      format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
    }) => analyticsService.exportReport(params.type, params.filters, params.format),
    onSuccess: (data) => {
      // Criar download do arquivo
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Relatório exportado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao exportar relatório');
    },
  });

  return {
    exportReport: exportMutation.mutate,
    isExporting: exportMutation.isPending,
  };
}

/**
 * Hook para comparação de períodos
 */
export function useAnalyticsComparison(
  currentFilters: AnalyticsFilter,
  comparisonFilters: AnalyticsFilter
) {
  const { user } = useAuthStore();

  const currentData = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.dashboard(), 'current', currentFilters],
    queryFn: () => analyticsService.getDashboardMetrics(currentFilters),
    enabled: !!user,
  });

  const comparisonData = useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.dashboard(), 'comparison', comparisonFilters],
    queryFn: () => analyticsService.getDashboardMetrics(comparisonFilters),
    enabled: !!user,
  });

  const comparison = useCallback(() => {
    if (!currentData.data || !comparisonData.data) return null;

    const current = currentData.data.overview;
    const previous = comparisonData.data.overview;

    return {
      totalProducts: {
        current: current.totalProducts,
        previous: previous.totalProducts,
        change: current.totalProducts - previous.totalProducts,
        changePercent: previous.totalProducts > 0 
          ? ((current.totalProducts - previous.totalProducts) / previous.totalProducts) * 100 
          : 0,
      },
      totalValidations: {
        current: current.totalValidations,
        previous: previous.totalValidations,
        change: current.totalValidations - previous.totalValidations,
        changePercent: previous.totalValidations > 0 
          ? ((current.totalValidations - previous.totalValidations) / previous.totalValidations) * 100 
          : 0,
      },
      totalQRScans: {
        current: current.totalQRScans,
        previous: previous.totalQRScans,
        change: current.totalQRScans - previous.totalQRScans,
        changePercent: previous.totalQRScans > 0 
          ? ((current.totalQRScans - previous.totalQRScans) / previous.totalQRScans) * 100 
          : 0,
      },
      activeUsers: {
        current: current.activeUsers,
        previous: previous.activeUsers,
        change: current.activeUsers - previous.activeUsers,
        changePercent: previous.activeUsers > 0 
          ? ((current.activeUsers - previous.activeUsers) / previous.activeUsers) * 100 
          : 0,
      },
    };
  }, [currentData.data, comparisonData.data]);

  return {
    currentData: currentData.data,
    comparisonData: comparisonData.data,
    comparison: comparison(),
    isLoading: currentData.isLoading || comparisonData.isLoading,
    error: currentData.error || comparisonData.error,
  };
}

/**
 * Hook para tracking de eventos
 */
export function useAnalyticsTracking() {
  const trackEventMutation = useMutation({
    mutationFn: (event: {
      eventType: string;
      entityType: string;
      entityId: string;
      data?: Record<string, any>;
    }) => analyticsService.trackEvent(event),
  });

  const trackEvent = useCallback((
    eventType: string,
    entityType: string,
    entityId: string,
    data?: Record<string, any>
  ) => {
    trackEventMutation.mutate({
      eventType,
      entityType,
      entityId,
      data,
    });
  }, [trackEventMutation]);

  return {
    trackEvent,
    isTracking: trackEventMutation.isPending,
  };
}
