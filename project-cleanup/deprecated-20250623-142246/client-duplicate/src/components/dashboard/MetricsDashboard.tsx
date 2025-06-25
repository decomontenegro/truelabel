import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  RefreshCw
} from 'lucide-react';
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
//   ResponsiveContainer
// } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';
import toast from 'react-hot-toast';

interface BusinessMetrics {
  overview: {
    totalProducts: number;
    activeProducts: number;
    totalValidations: number;
    completedValidations: number;
    totalBrands: number;
    activeBrands: number;
    totalQRScans: number;
    uniqueDevices: number;
  };
  growth: {
    productsThisMonth: number;
    productsLastMonth: number;
    productGrowthRate: number;
    validationsThisMonth: number;
    validationsLastMonth: number;
    validationGrowthRate: number;
    scansThisMonth: number;
    scansLastMonth: number;
    scanGrowthRate: number;
  };
  performance: {
    avgValidationTime: number;
    validationSuccessRate: number;
    avgScansPerProduct: number;
    topScanLocations: Array<{ location: string; count: number }>;
    peakScanHours: Array<{ hour: number; count: number }>;
  };
  quality: {
    validationPassRate: number;
    commonFailureReasons: Array<{ reason: string; count: number }>;
    avgProductRating: number;
    certificationRate: number;
  };
  revenue: {
    totalRevenue: number;
    revenueThisMonth: number;
    avgRevenuePerBrand: number;
    topRevenueBrands: Array<{ brand: string; revenue: number }>;
    subscriptionRevenue: number;
    transactionRevenue: number;
  };
  engagement: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    repeatScanRate: number;
    userRetentionRate: number;
  };
}

interface RealTimeMetrics {
  activeUsers: number;
  recentScans: number;
  pendingValidations: number;
  recentProducts: number;
  timestamp: string;
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const MetricsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case 'month':
        start = startOfMonth(end);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 30);
    }

    return { start, end };
  };

  // Fetch business metrics
  const { data: metrics, isLoading, refetch } = useQuery<BusinessMetrics>({
    queryKey: ['businessMetrics', dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await api.get('/analytics/metrics', {
        params: { start: start.toISOString(), end: end.toISOString() }
      });
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  // Fetch real-time metrics
  const { data: realTimeMetrics } = useQuery<RealTimeMetrics>({
    queryKey: ['realTimeMetrics'],
    queryFn: async () => {
      const response = await api.get('/analytics/metrics/realtime');
      return response.data;
    },
    refetchInterval: 60 * 1000 // Refresh every minute
  });

  // Export metrics
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { start, end } = getDateRange();
      const response = await api.get(`/analytics/metrics/export`, {
        params: {
          format: exportFormat,
          start: start.toISOString(),
          end: end.toISOString()
        },
        responseType: exportFormat === 'csv' ? 'blob' : 'json'
      });

      // Create download link
      const blob = exportFormat === 'csv' 
        ? response.data 
        : new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Métricas exportadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar métricas');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!metrics) {
    return <div>Erro ao carregar métricas</div>;
  }

  // Prepare chart data
  const growthChartData = [
    {
      name: 'Mês Anterior',
      Produtos: metrics.growth.productsLastMonth,
      Validações: metrics.growth.validationsLastMonth,
      Scans: metrics.growth.scansLastMonth
    },
    {
      name: 'Este Mês',
      Produtos: metrics.growth.productsThisMonth,
      Validações: metrics.growth.validationsThisMonth,
      Scans: metrics.growth.scansThisMonth
    }
  ];

  const hourlyScansData = metrics.performance.peakScanHours.map(h => ({
    hour: `${h.hour}h`,
    scans: h.count
  }));

  const locationData = metrics.performance.topScanLocations.slice(0, 5);

  const failureReasonsData = metrics.quality.commonFailureReasons.slice(0, 5);

  const revenueBrandsData = metrics.revenue.topRevenueBrands;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas de Negócio</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho da plataforma em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-40"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="month">Este mês</option>
            <option value="90d">Últimos 90 dias</option>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            icon={RefreshCw}
          >
            Atualizar
          </Button>
          
          <div className="flex items-center gap-2">
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              className="w-24"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </Select>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              loading={isExporting}
              icon={Download}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time metrics bar */}
      {realTimeMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-900">Tempo Real</span>
              <span className="text-xs text-blue-600">
                Atualizado {format(new Date(realTimeMetrics.timestamp), 'HH:mm:ss')}
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{realTimeMetrics.activeUsers}</span>
                <span className="text-gray-600">usuários online</span>
              </div>
              
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{realTimeMetrics.recentScans}</span>
                <span className="text-gray-600">scans/hora</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{realTimeMetrics.pendingValidations}</span>
                <span className="text-gray-600">validações pendentes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Produtos"
          value={metrics.overview.totalProducts}
          subtitle={`${metrics.overview.activeProducts} ativos`}
          icon={Package}
          trend={metrics.growth.productGrowthRate}
          color="blue"
        />
        
        <MetricCard
          title="Validações"
          value={metrics.overview.totalValidations}
          subtitle={`${metrics.overview.completedValidations} concluídas`}
          icon={CheckCircle}
          trend={metrics.growth.validationGrowthRate}
          color="green"
        />
        
        <MetricCard
          title="QR Code Scans"
          value={metrics.overview.totalQRScans}
          subtitle={`${metrics.overview.uniqueDevices} dispositivos`}
          icon={QrCode}
          trend={metrics.growth.scanGrowthRate}
          color="purple"
        />
        
        <MetricCard
          title="Receita Mensal"
          value={`R$ ${metrics.revenue.revenueThisMonth.toLocaleString('pt-BR')}`}
          subtitle={`${metrics.overview.activeBrands} marcas ativas`}
          icon={DollarSign}
          trend={0} // Calculate based on previous month
          color="yellow"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Crescimento Mensal</h3>
          <ChartPlaceholder
            type="bar"
            title="Crescimento Mensal"
            height={300}
            message="Gráfico de barras temporariamente desabilitado"
          />
        </Card>

        {/* Hourly Scans */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Scans por Hora</h3>
          <ChartPlaceholder
            type="area"
            title="Scans por Hora"
            height={300}
            message="Gráfico de área temporariamente desabilitado"
          />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Locations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Localizações</h3>
          <div className="space-y-3">
            {locationData.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{location.location}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(location.count / locationData[0].count) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {location.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quality Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Qualidade</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Taxa de Aprovação</span>
                <span className="text-sm font-medium">
                  {metrics.quality.validationPassRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metrics.quality.validationPassRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Taxa de Certificação</span>
                <span className="text-sm font-medium">
                  {metrics.quality.certificationRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics.quality.certificationRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Avaliação Média</span>
                <span className="text-sm font-medium">
                  {metrics.quality.avgProductRating.toFixed(1)} ⭐
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(metrics.quality.avgProductRating / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receita por Marca</h3>
          <ChartPlaceholder
            type="pie"
            title="Receita por Marca"
            height={200}
            message="Gráfico de pizza temporariamente desabilitado"
          />
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Tempo Médio de Validação"
          value={`${metrics.performance.avgValidationTime.toFixed(1)} dias`}
        />
        <StatCard
          label="Taxa de Sucesso"
          value={`${metrics.performance.validationSuccessRate.toFixed(1)}%`}
        />
        <StatCard
          label="Média de Scans/Produto"
          value={metrics.performance.avgScansPerProduct.toFixed(1)}
        />
        <StatCard
          label="Taxa de Retenção"
          value={`${metrics.engagement.userRetentionRate.toFixed(1)}%`}
        />
      </div>

      {/* Engagement Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Métricas de Engajamento</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.engagement.dailyActiveUsers}
            </div>
            <div className="text-sm text-gray-600">Usuários Ativos (Dia)</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.engagement.monthlyActiveUsers}
            </div>
            <div className="text-sm text-gray-600">Usuários Ativos (Mês)</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.engagement.avgSessionDuration.toFixed(1)} min
            </div>
            <div className="text-sm text-gray-600">Duração Média</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.engagement.repeatScanRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Rescan</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.engagement.userRetentionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Retenção</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
          ) : null}
          <span
            className={`text-sm font-medium ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs. mês anterior
          </span>
        </div>
      )}
    </Card>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
};

export default MetricsDashboard;