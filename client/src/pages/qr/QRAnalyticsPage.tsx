import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Users, Clock, TrendingUp, Calendar, Globe } from 'lucide-react';
import { qrService } from '@/services/qrService';
import { toast } from 'react-hot-toast';

interface QRAnalytics {
  totalScans: number;
  uniqueIPs: number;
  lastScan: string | null;
  scansByDate: Record<string, number>;
  scansByHour: Record<string, number>;
  recentScans: Array<{
    timestamp: string;
    userAgent: string;
    ip: string;
  }>;
}

const QRAnalyticsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    if (productId) {
      loadAnalytics();
    }
  }, [productId]);

  const loadAnalytics = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await qrService.getQRCodeAccesses(productId);
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('Erro ao carregar analytics do QR Code');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate, endDate: now };
  };

  const getFilteredData = () => {
    if (!analytics || timeRange === 'all') return analytics;

    const { startDate } = getDateRange();
    const filteredScansByDate = Object.entries(analytics.scansByDate)
      .filter(([date]) => new Date(date) >= startDate)
      .reduce((acc, [date, count]) => ({ ...acc, [date]: count }), {});

    return {
      ...analytics,
      scansByDate: filteredScansByDate
    };
  };

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    return 'Outros';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhum dado de analytics encontrado</p>
        <button
          onClick={() => navigate('/dashboard/products')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Produtos
        </button>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const totalScans = Object.values(filteredData?.scansByDate || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard/products')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics do QR Code</h1>
              <p className="text-gray-600 mt-1">Produto ID: {productId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="all">Todo período</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total de Escaneamentos</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Usuários Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.uniqueIPs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">No Período</p>
              <p className="text-2xl font-bold text-gray-900">{totalScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Último Escaneamento</p>
              <p className="text-sm font-medium text-gray-900">
                {analytics.lastScan ? 
                  new Date(analytics.lastScan).toLocaleDateString('pt-BR') : 
                  'Nunca'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico por Data */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escaneamentos por Data</h3>
        
        <div className="space-y-2">
          {Object.entries(filteredData?.scansByDate || {})
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .slice(0, 10)
            .map(([date, count]) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(date).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center">
                  <div 
                    className="bg-blue-200 h-4 rounded mr-2"
                    style={{ 
                      width: `${Math.max(20, (count / Math.max(...Object.values(filteredData?.scansByDate || {}))) * 200)}px` 
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Escaneamentos por Hora */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escaneamentos por Hora (Últimas 24h)</h3>
        
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 24 }, (_, hour) => {
            const count = analytics.scansByHour[hour] || 0;
            const maxCount = Math.max(...Object.values(analytics.scansByHour));
            const height = maxCount > 0 ? Math.max(20, (count / maxCount) * 100) : 20;
            
            return (
              <div key={hour} className="text-center">
                <div 
                  className="bg-blue-500 rounded-t mx-auto mb-1"
                  style={{ 
                    width: '20px',
                    height: `${height}px`,
                    opacity: count > 0 ? 1 : 0.2
                  }}
                ></div>
                <span className="text-xs text-gray-600">{hour}h</span>
                <div className="text-xs font-medium text-gray-900">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escaneamentos Recentes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escaneamentos Recentes</h3>
        
        <div className="space-y-3">
          {analytics.recentScans.length > 0 ? (
            analytics.recentScans.map((scan, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatUserAgent(scan.userAgent)}
                    </p>
                    <p className="text-xs text-gray-500">IP: {scan.ip}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(scan.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum escaneamento recente</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRAnalyticsPage;
