/**
 * Analytics Dashboard Component
 * 
 * Dashboard principal de analytics com métricas em tempo real
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CheckCircle,
  QrCode,
  DollarSign,
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  useDashboardAnalytics,
  useRealTimeAnalytics,
  useAnalyticsFilters,
  useAnalyticsExport
} from '../hooks/useAnalytics';
import { MetricCard } from './MetricCard';
import { AnalyticsChart } from './AnalyticsChart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { RealTimeWidget } from './RealTimeWidget';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { filters, updateFilters, resetFilters } = useAnalyticsFilters();
  const { exportReport, isExporting } = useAnalyticsExport();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useDashboardAnalytics(filters);

  const { data: realTimeData, isConnected } = useRealTimeAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar analytics</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const overview = dashboardData?.overview;

  const handleExport = (format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON') => {
    exportReport({
      type: 'dashboard',
      filters,
      format,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Visão geral das métricas e performance da plataforma
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
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>

          <div className="relative">
            <button
              onClick={() => handleExport('PDF')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <AnalyticsFilters
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Real-time Metrics */}
      {realTimeData && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <RealTimeWidget data={realTimeData} />
        </div>
      )}

      {/* Overview Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Produtos"
            value={overview.totalProducts}
            change={overview.growthRate}
            icon={<Package className="h-6 w-6" />}
            trend={overview.trends.products}
            color="blue"
          />

          <MetricCard
            title="Validações"
            value={overview.totalValidations}
            change={12.5}
            icon={<CheckCircle className="h-6 w-6" />}
            trend={overview.trends.validations}
            color="green"
          />

          <MetricCard
            title="QR Scans"
            value={overview.totalQRScans}
            change={8.3}
            icon={<QrCode className="h-6 w-6" />}
            trend={overview.trends.scans}
            color="purple"
          />

          <MetricCard
            title="Usuários Ativos"
            value={overview.activeUsers}
            change={15.2}
            icon={<Users className="h-6 w-6" />}
            trend={overview.trends.users}
            color="orange"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendência de Produtos
          </h3>
          <AnalyticsChart
            data={overview?.trends.products || []}
            type="line"
            xKey="date"
            yKey="value"
            color="#3B82F6"
          />
        </div>

        {/* Validations Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendência de Validações
          </h3>
          <AnalyticsChart
            data={overview?.trends.validations || []}
            type="area"
            xKey="date"
            yKey="value"
            color="#10B981"
          />
        </div>

        {/* QR Scans Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendência de QR Scans
          </h3>
          <AnalyticsChart
            data={overview?.trends.scans || []}
            type="bar"
            xKey="date"
            yKey="value"
            color="#8B5CF6"
          />
        </div>

        {/* Users Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendência de Usuários
          </h3>
          <AnalyticsChart
            data={overview?.trends.users || []}
            type="line"
            xKey="date"
            yKey="value"
            color="#F59E0B"
          />
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Taxa de Conversão
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {overview?.conversionRate.toFixed(1)}%
            </span>
            {overview && overview.conversionRate > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(overview?.conversionRate || 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
