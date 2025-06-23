import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  Calendar, 
  MapPin, 
  Smartphone, 
  TrendingUp,
  Download,
  Share2
} from 'lucide-react';
import { qrService } from '@/services/qrService';
import { productService } from '@/services/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface QRAccess {
  id: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  accessedAt: string;
}

interface QRStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  qrCode: string;
}

const QRAnalyticsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [accesses, setAccesses] = useState<QRAccess[]>([]);
  const [stats, setStats] = useState<QRStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadAnalytics();
    }
  }, [productId]);

  const loadAnalytics = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      
      // Carregar dados do produto
      const productResponse = await productService.getProduct(productId);
      setProduct(productResponse.product);

      // Carregar analytics do QR Code
      try {
        const analyticsResponse = await qrService.getQRCodeAccesses(productId);
        setAccesses(analyticsResponse.accesses || []);
        setStats(analyticsResponse.statistics || stats);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // QR Code ainda não foi acessado
          setAccesses([]);
          setStats({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Outro';
  };

  const exportData = () => {
    const csvContent = [
      ['Data/Hora', 'IP', 'Dispositivo', 'Navegador', 'Localização'],
      ...accesses.map(access => [
        formatDate(access.accessedAt),
        access.ipAddress,
        getDeviceInfo(access.userAgent),
        getBrowserInfo(access.userAgent),
        access.location || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${product?.name || 'produto'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Produto não encontrado
        </h3>
        <button
          onClick={() => navigate('/dashboard/qr-codes')}
          className="btn btn-primary"
        >
          Voltar para QR Codes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/qr-codes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics do QR Code</h1>
            <p className="text-gray-600">{product.name} - {product.sku}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="btn btn-outline flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total de Acessos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Smartphone className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Este Mês</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do QR Code
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Código QR</label>
            <p className="font-mono text-sm bg-gray-50 p-2 rounded">{product.qrCode}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">URL de Validação</label>
            <p className="text-sm bg-gray-50 p-2 rounded break-all">
              {`${window.location.origin}/validation/${product.qrCode}`}
            </p>
          </div>
        </div>
      </div>

      {/* Access History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Histórico de Acessos
          </h3>
        </div>

        {accesses.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum acesso registrado
            </h4>
            <p className="text-gray-600">
              O QR Code ainda não foi escaneado por nenhum usuário.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispositivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Navegador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accesses.map((access) => (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(access.accessedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {access.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-gray-400" />
                        {getDeviceInfo(access.userAgent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBrowserInfo(access.userAgent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {access.location || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRAnalyticsPage;
