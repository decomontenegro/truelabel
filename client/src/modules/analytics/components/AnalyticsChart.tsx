/**
 * Analytics Chart Component
 *
 * Componente de gráfico reutilizável para analytics
 * TEMPORARILY DISABLED - Using placeholder instead
 */

import React from 'react';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';
// Temporarily disabled recharts to fix initialization error
// import {
//   LineChart,
//   Line,
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from 'recharts';

interface AnalyticsChartProps {
  data: any[];
  type: 'line' | 'area' | 'bar' | 'pie';
  xKey: string;
  yKey: string | string[];
  color?: string | string[];
  height?: number;
  showAxes?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  className?: string;
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // orange
  '#EF4444', // red
  '#6B7280', // gray
  '#EC4899', // pink
  '#14B8A6', // teal
];

export function AnalyticsChart({
  data,
  type,
  xKey,
  yKey,
  color,
  height = 300,
  showAxes = true,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  strokeWidth = 2,
  className = ''
}: AnalyticsChartProps) {
  // Temporarily return placeholder instead of recharts
  return (
    <div className={`w-full ${className}`}>
      <ChartPlaceholder
        type={type}
        title={`Gráfico ${type}`}
        height={height}
        message="Componente de gráfico temporariamente desabilitado"
      />
    </div>
  );
}
