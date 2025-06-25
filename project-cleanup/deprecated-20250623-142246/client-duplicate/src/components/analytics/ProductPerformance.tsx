import React, { useState } from 'react';
// Temporarily disabled recharts to fix initialization error
// import {
//   LineChart,
//   Line,
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   RadialBarChart,
//   RadialBar,
//   PolarGrid,
//   PolarAngleAxis,
//   Cell
// } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  Package,
  Target
} from 'lucide-react';
import { ProductPerformanceMetrics, TrendData } from '@/types/analytics';
import { formatNumber, formatPercent } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';

interface ProductPerformanceProps {
  data: ProductPerformanceMetrics[];
  loading?: boolean;
  onProductSelect?: (productId: string) => void;
}

const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  data,
  loading = false,
  onProductSelect
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('daily');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Package className="h-12 w-12 mb-2 text-gray-400" />
        <p>Nenhum dado de performance disponível</p>
      </div>
    );
  }

  const selectedProductData = selectedProduct 
    ? data.find(p => p.productId === selectedProduct) 
    : data[0];

  if (!selectedProductData) return null;

  const getTrendIcon = (direction: TrendData['changeDirection']) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const trendData = selectedProductData.trends[selectedPeriod];
  const { comparisons } = selectedProductData;

  // Prepare data for radial chart
  const radialData = [
    {
      name: 'Performance',
      value: selectedProductData.performanceScore,
      fill: getHealthColor(selectedProductData.performanceScore)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="flex items-center justify-between">
        <select
          value={selectedProduct || data[0].productId}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            onProductSelect?.(e.target.value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {data.map(product => (
            <option key={product.productId} value={product.productId}>
              {product.productName} ({product.sku})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPeriod('daily')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selectedPeriod === 'daily'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selectedPeriod === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score de Saúde</h3>
          <div className="flex items-center justify-center">
            <ChartPlaceholder
              type="radial"
              title={`Score: ${selectedProductData.healthScore}`}
              height={150}
              message="Gráfico radial temporariamente desabilitado"
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {selectedProductData.healthScore >= 80 ? 'Excelente' : 
             selectedProductData.healthScore >= 60 ? 'Bom' : 'Atenção Necessária'}
          </p>
        </div>

        {/* Comparisons */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparações</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">vs Período Anterior</span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${comparisons.vsLastPeriod >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(Math.abs(comparisons.vsLastPeriod))}
                </span>
                {getTrendIcon(comparisons.vsLastPeriod >= 0 ? 'up' : 'down')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">vs Média Geral</span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${comparisons.vsAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(Math.abs(comparisons.vsAverage))}
                </span>
                {getTrendIcon(comparisons.vsAverage >= 0 ? 'up' : 'down')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">vs Categoria</span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${comparisons.vsCategoryAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(Math.abs(comparisons.vsCategoryAverage))}
                </span>
                {getTrendIcon(comparisons.vsCategoryAverage >= 0 ? 'up' : 'down')}
              </div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking</h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Target className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-4xl font-bold text-gray-900">#{comparisons.rank}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                de {comparisons.totalProducts} produtos
              </p>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2 w-32 mx-auto">
                  <div 
                    className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${((comparisons.totalProducts - comparisons.rank + 1) / comparisons.totalProducts) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Top {formatPercent(((comparisons.totalProducts - comparisons.rank + 1) / comparisons.totalProducts) * 100)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Performance</h3>
        <ChartPlaceholder
          type="area"
          title="Tendência de Performance"
          height={300}
          message="Gráfico de área temporariamente desabilitado"
        />
      </div>

      {/* Alerts */}
      {selectedProductData.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas e Recomendações</h3>
          <div className="space-y-3">
            {selectedProductData.alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  alert.type === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{alert.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.metric}: {alert.currentValue} (limite: {alert.threshold})
                    </p>
                    {alert.recommendation && (
                      <p className="text-sm text-gray-700 mt-2 font-medium">
                        Recomendação: {alert.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions */}
      {selectedProductData.trends.predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previsões</h3>
          <ChartPlaceholder
            type="line"
            title="Previsões"
            height={300}
            message="Gráfico de previsões temporariamente desabilitado"
          />
          <p className="text-sm text-gray-600 text-center mt-2">
            Confiança média: {formatPercent(selectedProductData.trends.predictions[0].confidence * 100)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductPerformance;