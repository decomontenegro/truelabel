import React from 'react';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface LifecycleMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
  icon?: React.ReactNode;
}

interface LifecycleMetricsProps {
  metrics: {
    activeValidations: number;
    expiringValidations: number;
    suspendedQRCodes: number;
    pendingRevalidations: number;
    averageValidityPeriod: number; // in days
    revalidationSuccessRate: number; // percentage
    averageRevalidationTime: number; // in days
    formulaChangeCount: number;
  };
  previousPeriodMetrics?: {
    activeValidations: number;
    expiringValidations: number;
    suspendedQRCodes: number;
    pendingRevalidations: number;
  };
}

export const LifecycleMetrics: React.FC<LifecycleMetricsProps> = ({
  metrics,
  previousPeriodMetrics
}) => {
  const calculateChange = (current: number, previous?: number): number | undefined => {
    if (previous === undefined) return undefined;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatMetricValue = (value: number | string | undefined, unit?: string): string => {
    // Handle undefined, null, or invalid values
    if (value === undefined || value === null) return '0';
    if (typeof value === 'string') return value;
    if (typeof value !== 'number' || isNaN(value)) return '0';

    if (unit === '%') return `${value}%`;
    if (unit === 'days') return `${value} days`;
    return value.toLocaleString();
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (!trend || trend === 'neutral') return null;
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const metricCards: LifecycleMetric[] = [
    {
      label: 'Active Validations',
      value: metrics.activeValidations,
      change: calculateChange(metrics.activeValidations, previousPeriodMetrics?.activeValidations),
      trend: previousPeriodMetrics ? 
        (metrics.activeValidations > previousPeriodMetrics.activeValidations ? 'up' : 'down') : 
        'neutral',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    },
    {
      label: 'Expiring Soon',
      value: metrics.expiringValidations,
      change: calculateChange(metrics.expiringValidations, previousPeriodMetrics?.expiringValidations),
      trend: previousPeriodMetrics ? 
        (metrics.expiringValidations > previousPeriodMetrics.expiringValidations ? 'down' : 'up') : 
        'neutral',
      icon: <Clock className="h-5 w-5 text-orange-600" />
    },
    {
      label: 'Suspended QR Codes',
      value: metrics.suspendedQRCodes,
      change: calculateChange(metrics.suspendedQRCodes, previousPeriodMetrics?.suspendedQRCodes),
      trend: previousPeriodMetrics ? 
        (metrics.suspendedQRCodes > previousPeriodMetrics.suspendedQRCodes ? 'down' : 'up') : 
        'neutral',
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />
    },
    {
      label: 'Pending Revalidations',
      value: metrics.pendingRevalidations,
      change: calculateChange(metrics.pendingRevalidations, previousPeriodMetrics?.pendingRevalidations),
      trend: 'neutral',
      icon: <RefreshCw className="h-5 w-5 text-indigo-600" />
    }
  ];

  const additionalMetrics = [
    {
      label: 'Avg. Validity Period',
      value: formatMetricValue(metrics.averageValidityPeriod, 'days'),
      icon: <Calendar className="h-4 w-4 text-gray-500" />
    },
    {
      label: 'Revalidation Success Rate',
      value: formatMetricValue(metrics.revalidationSuccessRate, '%'),
      icon: <BarChart3 className="h-4 w-4 text-gray-500" />
    },
    {
      label: 'Avg. Revalidation Time',
      value: formatMetricValue(metrics.averageRevalidationTime, 'days'),
      icon: <Clock className="h-4 w-4 text-gray-500" />
    },
    {
      label: 'Formula Changes',
      value: metrics.formulaChangeCount,
      icon: <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              {metric.icon}
              {metric.change !== undefined && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {formatMetricValue(metric.value ?? 0, metric.unit)}
              </p>
              <p className="text-sm text-gray-500">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {additionalMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                {metric.icon}
              </div>
              <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Lifecycle Insights</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          {metrics.expiringValidations > 10 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>{metrics.expiringValidations} validations expiring in the next 30 days. Consider scheduling revalidations.</span>
            </li>
          )}
          {metrics.revalidationSuccessRate < 90 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Revalidation success rate is below 90%. Review failed revalidations for common issues.</span>
            </li>
          )}
          {metrics.averageRevalidationTime > 14 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Average revalidation time exceeds 2 weeks. Consider optimizing the revalidation process.</span>
            </li>
          )}
          {metrics.formulaChangeCount > 5 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>High number of formula changes detected. Ensure all affected products are revalidated.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};