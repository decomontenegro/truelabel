import React, { useState } from 'react';
// Temporarily disabled recharts to fix initialization error
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
//   Treemap
// } from 'recharts';
import {
  Users,
  TrendingUp,
  Heart,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  UserCheck,
  Share2
} from 'lucide-react';
import { ConsumerInsights as ConsumerInsightsType } from '@/types/analytics';
import { formatNumber, formatPercent } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';

interface ConsumerInsightsProps {
  data: ConsumerInsightsType;
  loading?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const ConsumerInsights: React.FC<ConsumerInsightsProps> = ({
  data,
  loading = false
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'segments' | 'behaviors' | 'preferences' | 'loyalty'>('segments');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderSegments = () => (
    <div className="space-y-6">
      {/* Segments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.segments.map((segment, index) => (
          <div
            key={segment.id}
            className={`bg-white rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-all ${
              selectedSegment === segment.id
                ? 'border-blue-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSegment(segment.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">{segment.name}</h4>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tamanho</span>
                <span className="font-medium">{formatNumber(segment.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Crescimento</span>
                <span className={`font-medium ${segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {segment.growthRate > 0 ? '+' : ''}{formatPercent(segment.growthRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valor</span>
                <span className="font-medium">{segment.value.toFixed(1)}/10</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">Características:</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {segment.characteristics.slice(0, 2).map((char, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {char}
                  </span>
                ))}
                {segment.characteristics.length > 2 && (
                  <span className="text-xs text-gray-500">+{segment.characteristics.length - 2}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Segmentos</h3>
        <ChartPlaceholder
          height={300}
          title="Gráfico de Pizza - Distribuição de Segmentos"
          description="Visualização da distribuição dos segmentos de consumidores"
        />
      </div>
    </div>
  );

  const renderBehaviors = () => (
    <div className="space-y-6">
      {/* Behavior Patterns */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Padrões de Comportamento</h3>
        <div className="space-y-4">
          {data.behaviors.map((behavior, index) => (
            <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{behavior.pattern}</h4>
                  <p className="text-sm text-gray-600 mt-1">{behavior.impact}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">
                      <Users className="inline h-4 w-4 mr-1" />
                      {formatNumber(behavior.users)} usuários
                    </span>
                    <span className="text-sm text-gray-500">
                      Frequência: {formatPercent(behavior.frequency * 100)}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  behavior.trend === 'emerging' ? 'bg-green-100 text-green-700' :
                  behavior.trend === 'declining' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {behavior.trend === 'emerging' ? 'Emergente' :
                   behavior.trend === 'declining' ? 'Declinando' : 'Estável'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Behavior Impact Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impacto dos Comportamentos</h3>
        <ChartPlaceholder
          height={300}
          title="Gráfico de Barras - Impacto dos Comportamentos"
          description="Visualização do impacto dos diferentes padrões de comportamento"
        />
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      {/* Device Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Dispositivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.preferences.deviceDistribution.map((device, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getDeviceIcon(device.device)}
                <span className="font-medium text-gray-900">{device.device}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{formatPercent(device.percentage)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Horários de Pico</h3>
        <ChartPlaceholder
          height={200}
          title="Gráfico de Barras - Horários de Pico"
          description="Visualização dos horários com maior atividade de usuários"
        />
      </div>

      {/* Top Sections & Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seções Mais Visitadas</h3>
          <div className="space-y-3">
            {data.preferences.topSections.map((section, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{section.section}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {formatPercent(section.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Populares</h3>
          <div className="space-y-3">
            {data.preferences.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{product.productName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {formatPercent(product.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoyalty = () => (
    <div className="space-y-6">
      {/* Loyalty Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Retorno</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercent(data.loyaltyMetrics.returnRate * 100)}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Vitalício</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                R$ {data.loyaltyMetrics.lifetimeValue.toFixed(2)}
              </p>
            </div>
            <Heart className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Churn</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercent(data.loyaltyMetrics.churnRate * 100)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">NPS Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.loyaltyMetrics.nps}
              </p>
            </div>
            <Share2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Visit Frequency Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Frequência de Visitas</h3>
        <ChartPlaceholder
          height={300}
          title="Gráfico de Barras - Frequência de Visitas"
          description="Distribuição dos usuários por número de visitas"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'segments'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Segmentos
        </button>
        <button
          onClick={() => setActiveTab('behaviors')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'behaviors'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Comportamentos
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Preferências
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'loyalty'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Fidelidade
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'segments' && renderSegments()}
      {activeTab === 'behaviors' && renderBehaviors()}
      {activeTab === 'preferences' && renderPreferences()}
      {activeTab === 'loyalty' && renderLoyalty()}
    </div>
  );
};

export default ConsumerInsights;