import React, { useState, useEffect } from 'react';
import { 
  Package, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Upload,
  AlertCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface DashboardStats {
  totalReports: number;
  pendingValidations: number;
  completedToday: number;
  rejectionRate: number;
  recentReports: any[];
  pendingTasks: any[];
}

export default function LaboratoryDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas do laboratório usando endpoints corretos
      const validationsRes = await api.get('/validations');
      const validations = validationsRes.data.data || [];

      // Calcular estatísticas
      const today = new Date().toDateString();
      const completedToday = validations.filter((v: any) =>
        v.status === 'APPROVED' && new Date(v.createdAt).toDateString() === today
      ).length;

      const totalValidations = validations.length;
      const rejectedValidations = validations.filter((v: any) => v.status === 'REJECTED').length;
      const rejectionRate = totalValidations > 0 ? (rejectedValidations / totalValidations) * 100 : 0;

      // Simular relatórios recentes baseados nas validações aprovadas
      const recentReports = validations
        .filter((v: any) => v.status === 'APPROVED')
        .slice(0, 5)
        .map((v: any) => ({
          id: v.id,
          product: { name: v.productName },
          createdAt: v.createdAt,
          validations: [{ status: v.status }]
        }));

      setStats({
        totalReports: validations.filter((v: any) => v.status === 'APPROVED').length,
        pendingValidations: validations.filter((v: any) => v.status === 'PENDING').length,
        completedToday,
        rejectionRate: Math.round(rejectionRate),
        recentReports,
        pendingTasks: validations.filter((v: any) => v.status === 'PENDING').slice(0, 5)
      });
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard do Laboratório
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo, {user?.name}! Gerencie seus relatórios e validações.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalReports || 0}
              </p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validações Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats?.pendingValidations || 0}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídos Hoje</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats?.completedToday || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Rejeição</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats?.rejectionRate || 0}%
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/lab/reports/new')}
          className="bg-primary-600 text-white rounded-lg p-6 hover:bg-primary-700 transition-colors"
        >
          <Upload className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold">Novo Relatório</h3>
          <p className="text-sm mt-1 opacity-90">Fazer upload de análise</p>
        </button>

        <button
          onClick={() => navigate('/lab/validations')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-600 transition-colors"
        >
          <AlertCircle className="h-8 w-8 mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Fila de Validação</h3>
          <p className="text-sm mt-1 text-gray-600">
            {stats?.pendingValidations || 0} pendentes
          </p>
        </button>

        <button
          onClick={() => navigate('/lab/analytics')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-600 transition-colors"
        >
          <BarChart3 className="h-8 w-8 mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Relatórios</h3>
          <p className="text-sm mt-1 text-gray-600">Ver estatísticas</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarefas Pendentes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tarefas Pendentes
          </h2>
          {stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {stats.pendingTasks.map((task: any) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/lab/validations/${task.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.productName || task.product?.name || 'Produto'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Solicitado em {formatDate(task.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    Pendente
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhuma tarefa pendente
            </p>
          )}
        </div>

        {/* Relatórios Recentes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Relatórios Recentes
          </h2>
          {stats?.recentReports && stats.recentReports.length > 0 ? (
            <div className="space-y-3">
              {stats.recentReports.map((report: any) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/lab/reports/${report.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {report.product?.name || 'Produto'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    report.validations?.[0]?.status === 'VALIDATED' 
                      ? 'text-green-600' 
                      : report.validations?.[0]?.status === 'REJECTED'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {report.validations?.[0]?.status === 'VALIDATED' 
                      ? 'Validado' 
                      : report.validations?.[0]?.status === 'REJECTED'
                      ? 'Rejeitado'
                      : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhum relatório recente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}