import React, { useState, useEffect } from 'react';
// Temporarily disabled recharts to fix initialization error
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   TooltipProps,
//   Legend,
//   ResponsiveContainer,
//   Area,
//   AreaChart,
// } from 'recharts';
// import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Filter,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import analyticsService, {
  AnalyticsOverview,
  AnalyticsFilters,
} from '@/services/analyticsService';
import { 
  EnhancedAnalyticsOverview,
  GeoHeatmapData,
  ProductPerformanceMetrics,
  ConsumerInsights,
  PredictiveInsights,
  RealTimeMetrics,
  ExportOptions
} from '@/types/analytics';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';
import toast from 'react-hot-toast';

// Import new analytics components
import QRScanHeatmap from '@/components/analytics/QRScanHeatmap';
import ProductPerformance from '@/components/analytics/ProductPerformance';
import ConsumerInsightsComponent from '@/components/analytics/ConsumerInsights';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import ExportReports from '@/components/analytics/ExportReports';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Custom Tooltip Components - Temporarily disabled
// const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
//         <p className="text-sm font-medium text-gray-900">{label}</p>
//         {payload.map((entry, index) => (
//           <p key={index} className="text-sm" style={{ color: entry.color }}>
//             {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
//           </p>
//         ))}
//       </div>
//     );
//   }
//   return null;
// };

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState<EnhancedAnalyticsOverview | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'geographic' | 'products' | 'consumers' | 'predictive' | 'export'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  const { loading, execute: loadAnalytics } = useAsyncAction(async () => {
    try {
      setError(null);
      const [basicData, enhancedData] = await Promise.all([
        analyticsService.getAnalyticsOverview(filters),
        analyticsService.getEnhancedAnalytics(filters)
      ]);
      setAnalytics(basicData);
      setEnhancedAnalytics(enhancedData);
    } catch (err) {
      setError('Erro ao carregar dados de analytics. Por favor, tente novamente.');
      console.error('Analytics error:', err);
    }
  });

  // Load specific analytics data
  const { loading: loadingGeo, execute: loadGeographic } = useAsyncAction(async () => {
    const data = await analyticsService.getGeographicAnalytics(filters);
    setEnhancedAnalytics(prev => prev ? { ...prev, geographic: data } : null);
  });

  const { loading: loadingPerformance, execute: loadPerformance } = useAsyncAction(async () => {
    const productIds = enhancedAnalytics?.performance.map(p => p.productId) || ['1', '2', '3'];
    const data = await Promise.all(
      productIds.map(id => analyticsService.getProductPerformance(id, filters))
    );
    setEnhancedAnalytics(prev => prev ? { ...prev, performance: data } : null);
  });

  const { loading: loadingConsumer, execute: loadConsumer } = useAsyncAction(async () => {
    const data = await analyticsService.getConsumerInsights(filters);
    setEnhancedAnalytics(prev => prev ? { ...prev, consumer: data } : null);
  });

  const { loading: loadingPredictive, execute: loadPredictive } = useAsyncAction(async () => {
    const data = await analyticsService.getPredictiveInsights(filters);
    setEnhancedAnalytics(prev => prev ? { ...prev, predictive: data } : null);
  });

  // Export functionality
  const { loading: exporting, execute: exportReport } = useAsyncAction(async (options: ExportOptions) => {
    const blob = await analyticsService.exportCustomReport(options);
    const filename = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.${options.format}`;
    analyticsService.downloadReport(blob, filename);
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (activeTab === 'overview') {
      analyticsService.connectWebSocket((event) => {
        if (event.type === 'update' && enhancedAnalytics) {
          // Update real-time metrics
          setEnhancedAnalytics(prev => prev ? {
            ...prev,
            realtime: event.data as RealTimeMetrics
          } : null);
        }
      });

      return () => {
        analyticsService.disconnectWebSocket();
      };
    }
  }, [activeTab]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        loadAnalytics();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, filters]);

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const end = new Date();
    let start = new Date();

    switch (range) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '1y':
        start = subDays(end, 365);
        break;
    }

    setFilters({
      ...filters,
      startDate: format(startOfDay(start), 'yyyy-MM-dd'),
      endDate: format(endOfDay(end), 'yyyy-MM-dd'),
    });
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    
    // Load specific data when tab changes
    switch (tab) {
      case 'geographic':
        if (!enhancedAnalytics?.geographic?.length) {
          loadGeographic();
        }
        break;
      case 'products':
        if (!enhancedAnalytics?.performance?.length) {
          loadPerformance();
        }
        break;
      case 'consumers':
        if (!enhancedAnalytics?.consumer) {
          loadConsumer();
        }
        break;
      case 'predictive':
        if (!enhancedAnalytics?.predictive) {
          loadPredictive();
        }
        break;
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadAnalytics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || !enhancedAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Nenhum dado de analytics disponível.</p>
      </div>
    );
  }

  const { qrScans, demographics, sectionEngagement, engagement, topProducts } = analytics;
  const formattedScansByPeriod = qrScans.scansByPeriod.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), 'dd/MM'),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Analytics</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho e engajamento dos seus produtos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => handleDateRangeChange('7d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => handleDateRangeChange('30d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => handleDateRangeChange('90d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              90 dias
            </button>
            <button
              onClick={() => handleDateRangeChange('1y')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === '1y'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              1 ano
            </button>
          </div>

          {/* Auto Refresh */}
          <select
            value={refreshInterval || ''}
            onChange={(e) => setRefreshInterval(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Sem atualização</option>
            <option value="30000">30 segundos</option>
            <option value="60000">1 minuto</option>
            <option value="300000">5 minutos</option>
          </select>

          {/* Manual Refresh */}
          <button
            onClick={() => loadAnalytics()}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => handleTabChange('geographic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'geographic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Geográfico
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => handleTabChange('consumers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consumers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Consumidores
          </button>
          <button
            onClick={() => handleTabChange('predictive')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'predictive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preditivo
          </button>
          <button
            onClick={() => handleTabChange('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Exportar
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Real-time Metrics */}
          {enhancedAnalytics.realtime && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-600 animate-pulse" />
                  <span className="font-medium text-yellow-800">Atividade em Tempo Real</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-700">
                    <Users className="inline h-4 w-4 mr-1" />
                    {enhancedAnalytics.realtime.activeUsers} usuários ativos
                  </span>
                  <span className="text-yellow-700">
                    <MousePointer className="inline h-4 w-4 mr-1" />
                    {enhancedAnalytics.realtime.activeScans} escaneamentos ativos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Escaneamentos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {qrScans.totalScans.toLocaleString()}
                  </p>
                  {enhancedAnalytics.comparisons && (
                    <p className={`text-sm mt-1 ${
                      enhancedAnalytics.comparisons.changes.totalScans?.percentage >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {enhancedAnalytics.comparisons.changes.totalScans?.percentage >= 0 ? '+' : ''}
                      {enhancedAnalytics.comparisons.changes.totalScans?.percentage.toFixed(1)}% vs período anterior
                    </p>
                  )}
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MousePointer className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Visitantes Únicos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {qrScans.uniqueScans.toLocaleString()}
                  </p>
                  {enhancedAnalytics.comparisons && (
                    <p className={`text-sm mt-1 ${
                      enhancedAnalytics.comparisons.changes.uniqueUsers?.percentage >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {enhancedAnalytics.comparisons.changes.uniqueUsers?.percentage >= 0 ? '+' : ''}
                      {enhancedAnalytics.comparisons.changes.uniqueUsers?.percentage.toFixed(1)}% vs período anterior
                    </p>
                  )}
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Engajamento</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {((1 - engagement.bounceRate) * 100).toFixed(1)}%
                  </p>
                  {enhancedAnalytics.comparisons && (
                    <p className={`text-sm mt-1 ${
                      enhancedAnalytics.comparisons.changes.engagementRate?.percentage >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {enhancedAnalytics.comparisons.changes.engagementRate?.percentage >= 0 ? '+' : ''}
                      {enhancedAnalytics.comparisons.changes.engagementRate?.percentage.toFixed(1)}% vs período anterior
                    </p>
                  )}
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio de Sessão</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.floor(engagement.averageSessionDuration / 60)}m{' '}
                    {engagement.averageSessionDuration % 60}s
                  </p>
                  {enhancedAnalytics.summary.topMetrics.find(m => m.name === 'Tempo Médio') && (
                    <p className={`text-sm mt-1 ${
                      enhancedAnalytics.summary.topMetrics.find(m => m.name === 'Tempo Médio')!.change >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {enhancedAnalytics.summary.topMetrics.find(m => m.name === 'Tempo Médio')!.change >= 0 ? '+' : ''}
                      {enhancedAnalytics.summary.topMetrics.find(m => m.name === 'Tempo Médio')!.change.toFixed(1)}% vs período anterior
                    </p>
                  )}
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          {enhancedAnalytics.summary.keyInsights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Principais Insights</h3>
              <ul className="space-y-1">
                {enhancedAnalytics.summary.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-sm text-blue-800">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scans Over Time */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Escaneamentos ao Longo do Tempo
              </h2>
              <ChartPlaceholder
                type="area"
                title="Escaneamentos ao Longo do Tempo"
                height={300}
                message="Gráfico de área temporariamente desabilitado"
              />
            </div>

            {/* Device Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Distribuição por Dispositivo
              </h2>
              <ChartPlaceholder
                type="pie"
                title="Distribuição por Dispositivo"
                height={300}
                message="Gráfico de pizza temporariamente desabilitado"
              />
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Produtos Mais Escaneados
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Escaneamentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitantes Únicos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Retorno
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.scans.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(
                          ((product.scans - product.uniqueVisitors) / product.scans) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'geographic' && (
        <div className="space-y-6">
          <QRScanHeatmap
            data={enhancedAnalytics.geographic || []}
            loading={loadingGeo}
            onLocationClick={(location) => {
              console.log('Location clicked:', location);
              // You can add filtering by location here
            }}
          />
        </div>
      )}

      {activeTab === 'products' && (
        <ProductPerformance
          data={enhancedAnalytics.performance || []}
          loading={loadingPerformance}
          onProductSelect={(productId) => {
            console.log('Product selected:', productId);
            // You can add additional actions here
          }}
        />
      )}

      {activeTab === 'consumers' && (
        <ConsumerInsightsComponent
          data={enhancedAnalytics.consumer || {
            segments: [],
            behaviors: [],
            preferences: {
              topSections: [],
              topProducts: [],
              peakHours: [],
              deviceDistribution: []
            },
            loyaltyMetrics: {
              returnRate: 0,
              frequencyDistribution: [],
              lifetimeValue: 0,
              churnRate: 0,
              nps: 0
            }
          }}
          loading={loadingConsumer}
        />
      )}

      {activeTab === 'predictive' && (
        <PredictiveAnalytics
          data={enhancedAnalytics.predictive || {
            forecasts: [],
            anomalies: [],
            recommendations: [],
            riskAssessment: {
              overallRisk: 'low',
              riskFactors: [],
              mitigationStrategies: []
            },
            opportunityAnalysis: {
              opportunities: [],
              marketTrends: [],
              competitiveAdvantages: []
            }
          }}
          loading={loadingPredictive}
          onRecommendationAction={(recommendationId) => {
            toast.success('Recomendação adicionada à lista de tarefas');
            console.log('Recommendation action:', recommendationId);
          }}
        />
      )}

      {activeTab === 'export' && (
        <ExportReports
          filters={filters}
          onExport={exportReport}
          onSchedule={async (schedule) => {
            await analyticsService.scheduleReport(schedule);
            toast.success('Relatório agendado com sucesso');
          }}
          loading={exporting}
        />
      )}
    </div>
  );
}