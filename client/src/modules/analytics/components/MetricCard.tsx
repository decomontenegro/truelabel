/**
 * Metric Card Component
 * 
 * Cartão para exibir métricas com tendências
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnalyticsChart } from './AnalyticsChart';
import type { TrendData } from '../types';

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  trend?: TrendData[];
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  format?: 'number' | 'currency' | 'percentage';
  size?: 'sm' | 'md' | 'lg';
  showChart?: boolean;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    accent: 'text-blue-600',
    chart: '#3B82F6',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    accent: 'text-green-600',
    chart: '#10B981',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    accent: 'text-purple-600',
    chart: '#8B5CF6',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    accent: 'text-orange-600',
    chart: '#F59E0B',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    accent: 'text-red-600',
    chart: '#EF4444',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    accent: 'text-gray-600',
    chart: '#6B7280',
  },
};

export function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  color = 'blue',
  format = 'number',
  size = 'md',
  showChart = true,
  loading = false
}: MetricCardProps) {
  const colors = colorClasses[color];

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const cardSizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${cardSizeClasses[size]} animate-pulse`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        {showChart && (
          <div className="mt-4 h-16 bg-gray-200 rounded"></div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${cardSizeClasses[size]} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>
            {icon}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
      </div>

      {/* Change */}
      {change !== undefined && (
        <div className="flex items-center space-x-1 mb-4">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">
            vs período anterior
          </span>
        </div>
      )}

      {/* Mini Chart */}
      {showChart && trend && trend.length > 0 && (
        <div className="mt-4">
          <div className="h-16">
            <AnalyticsChart
              data={trend}
              type="line"
              xKey="date"
              yKey="value"
              color={colors.chart}
              showAxes={false}
              showGrid={false}
              showTooltip={false}
              strokeWidth={2}
            />
          </div>
        </div>
      )}

      {/* Additional Info */}
      {trend && trend.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Últimos {trend.length} períodos
        </div>
      )}
    </div>
  );
}
