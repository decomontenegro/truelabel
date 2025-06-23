/**
 * Security Dashboard Component
 * 
 * Dashboard principal de segurança com métricas e eventos
 */

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Bell
} from 'lucide-react';
import {
  useSecurityEvents,
  useSecurityMetrics,
  useRealTimeSecurityEvents,
  useSecurityFilters
} from '../hooks/useSecurity';
import { SecurityEventsList } from './SecurityEventsList';
import { SecurityMetricsCard } from './SecurityMetricsCard';
import { ThreatDetectionWidget } from './ThreatDetectionWidget';
import { RealTimeSecurityFeed } from './RealTimeSecurityFeed';
import { SecurityFilters } from './SecurityFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { filters, updateFilters, resetFilters } = useSecurityFilters();

  const {
    events,
    total,
    isLoading: eventsLoading,
    refetch: refetchEvents
  } = useSecurityEvents(filters);

  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics
  } = useSecurityMetrics();

  const { recentEvents, isConnected } = useRealTimeSecurityEvents();

  const handleRefresh = () => {
    refetchEvents();
    refetchMetrics();
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>Security Dashboard</span>
          </h1>
          <p className="text-gray-600">
            Monitoramento de segurança e detecção de ameaças em tempo real
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Real-time indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Tempo real' : 'Desconectado'}
            </span>
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            <span>Filtros</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <SecurityFilters
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Security Status Alert */}
      {metrics && metrics.overview.criticalEvents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Atenção: Eventos Críticos Detectados
              </h3>
              <p className="text-red-700">
                {metrics.overview.criticalEvents} eventos críticos requerem atenção imediata.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SecurityMetricsCard
            title="Total de Eventos"
            value={metrics.overview.totalEvents}
            icon={<Activity className="h-6 w-6" />}
            color="blue"
            trend={metrics.trends.events}
          />

          <SecurityMetricsCard
            title="Eventos Críticos"
            value={metrics.overview.criticalEvents}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
            change={-12.5}
          />

          <SecurityMetricsCard
            title="Eventos Resolvidos"
            value={metrics.overview.resolvedEvents}
            icon={<Shield className="h-6 w-6" />}
            color="green"
            change={8.3}
          />

          <SecurityMetricsCard
            title="Tempo Médio de Resolução"
            value={metrics.overview.averageResolutionTime}
            format="duration"
            icon={<Eye className="h-6 w-6" />}
            color="purple"
            change={-5.2}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Eventos de Segurança Recentes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {total} eventos encontrados
              </p>
            </div>
            
            <SecurityEventsList
              events={events}
              loading={eventsLoading}
              onRefresh={refetchEvents}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Real-time Feed */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Feed em Tempo Real</span>
              </h3>
            </div>
            
            <RealTimeSecurityFeed events={recentEvents} />
          </div>

          {/* Threat Detection */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detecção de Ameaças
              </h3>
            </div>
            
            <ThreatDetectionWidget />
          </div>
        </div>
      </div>

      {/* Security Metrics Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events by Type */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Eventos por Tipo
            </h3>
            <div className="space-y-3">
              {metrics.eventsByType.slice(0, 5).map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribuição de Riscos
            </h3>
            <div className="space-y-3">
              {metrics.riskDistribution.map((item) => (
                <div key={item.level} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    item.level === 'CRITICAL' ? 'text-red-600' :
                    item.level === 'HIGH' ? 'text-orange-600' :
                    item.level === 'MEDIUM' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {item.level}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.level === 'CRITICAL' ? 'bg-red-500' :
                          item.level === 'HIGH' ? 'bg-orange-500' :
                          item.level === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
