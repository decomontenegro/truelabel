import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  CheckCircle, 
  QrCode,
  Users,
  DollarSign,
  Activity,
  Download
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import api from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MetricsOverview {
  products: {
    total: number;
    active: number;
    validated: number;
    growth: number;
  };
  validations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  qrScans: {
    total: number;
    unique: number;
    today: number;
    growth: number;
  };
  users: {
    total: number;
    brands: number;
    laboratories: number;
    active: number;
  };
  revenue: {
    current: number;
    growth: number;
    mrr: number;
  };
}

export default function BusinessMetrics() {
  const [period, setPeriod] = useState('30d');
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [scanTrend, setScanTrend] = useState<any[]>([]);
  const [productMetrics, setProductMetrics] = useState<any[]>([]);
  
  const { execute: loadMetrics, loading } = useAsyncAction(async () => {
    const [overview, scans, products] = await Promise.all([
      api.get(`/analytics/metrics?period=${period}`),
      api.get(`/analytics/metrics/scans?groupBy=day&limit=30`),
      api.get(`/analytics/metrics/products?limit=10`)
    ]);
    
    setMetrics(overview.data.data);
    setScanTrend(scans.data.data);
    setProductMetrics(products.data.data);
  });

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/analytics/metrics/export?format=${format}&period=${period}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${period}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const validationData = [
    { name: 'Aprovadas', value: metrics.validations.approved, color: '#10B981' },
    { name: 'Pendentes', value: metrics.validations.pending, color: '#F59E0B' },
    { name: 'Rejeitadas', value: metrics.validations.rejected, color: '#EF4444' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Métricas de Negócio</h1>
            <p className="text-gray-600 mt-2">Visão geral do desempenho da plataforma</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold mt-1">{metrics.products.total}</p>
              <p className="text-xs text-green-600 mt-1">
                +{metrics.products.growth}% este mês
              </p>
            </div>
            <Package className="h-8 w-8 text-primary-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validações</p>
              <p className="text-2xl font-bold mt-1">{metrics.validations.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.validations.pending} pendentes
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">QR Scans</p>
              <p className="text-2xl font-bold mt-1">{metrics.qrScans.total}</p>
              <p className="text-xs text-green-600 mt-1">
                +{metrics.qrScans.growth}% hoje
              </p>
            </div>
            <QrCode className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold mt-1">{metrics.users.active}</p>
              <p className="text-xs text-gray-500 mt-1">
                de {metrics.users.total} total
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MRR</p>
              <p className="text-2xl font-bold mt-1">
                R$ {metrics.revenue.mrr.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{metrics.revenue.growth}%
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* QR Scan Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendência de Scans</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scanTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scans" 
                stroke="#3B82F6" 
                name="Scans"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Validation Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status de Validações</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={validationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {validationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 10 Produtos</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={productMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalScans" fill="#3B82F6" name="Scans" />
            <Bar dataKey="validations" fill="#10B981" name="Validações" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Usuários</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Marcas</span>
              <span className="font-semibold">{metrics.users.brands}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Laboratórios</span>
              <span className="font-semibold">{metrics.users.laboratories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Validadores</span>
              <span className="font-semibold">
                {metrics.users.total - metrics.users.brands - metrics.users.laboratories}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Taxa de Aprovação</span>
              <span className="font-semibold">
                {((metrics.validations.approved / metrics.validations.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Produtos Validados</span>
              <span className="font-semibold">
                {((metrics.products.validated / metrics.products.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Engajamento</span>
              <span className="font-semibold">
                {((metrics.users.active / metrics.users.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Insights</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              📈 Crescimento de {metrics.products.growth}% em novos produtos
            </p>
            <p className="text-sm text-gray-600">
              🎯 {metrics.qrScans.unique} usuários únicos escanearam QR codes
            </p>
            <p className="text-sm text-gray-600">
              ⏱️ Tempo médio de validação: 2.3 dias
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}