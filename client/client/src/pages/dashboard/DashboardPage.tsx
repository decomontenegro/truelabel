import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  Package,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

const DashboardPage = () => {
  const { user } = useAuthStore();

  // Redirecionar usuários LAB para seu dashboard específico
  if (user?.role === 'LAB') {
    return <Navigate to="/dashboard/lab/dashboard" replace />;
  }

  // Mock data - em produção, viria da API
  const stats = {
    products: 12,
    reports: 8,
    validations: 6,
    pending: 2,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'product',
      title: 'Novo produto cadastrado',
      description: 'Iogurte Grego Natural - SKU: IOG001',
      date: new Date(),
      status: 'success',
    },
    {
      id: 2,
      type: 'validation',
      title: 'Validação aprovada',
      description: 'Suplemento Pré-Treino validado com sucesso',
      date: new Date(Date.now() - 86400000),
      status: 'success',
    },
    {
      id: 3,
      type: 'report',
      title: 'Novo relatório recebido',
      description: 'Análise nutricional - Laboratório Exemplo',
      date: new Date(Date.now() - 172800000),
      status: 'info',
    },
  ];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'BRAND':
        return {
          title: 'Gerencie seus produtos',
          description: 'Cadastre produtos, acompanhe validações e gere QR codes',
          quickActions: [
            {
              title: 'Novo Produto',
              description: 'Cadastrar um novo produto',
              href: '/dashboard/products/new',
              icon: Plus,
              color: 'bg-primary-500',
            },
            {
              title: 'Meus Produtos',
              description: 'Ver todos os produtos',
              href: '/dashboard/products',
              icon: Package,
              color: 'bg-blue-500',
            },
          ],
        };
      case 'LAB':
        return {
          title: 'Gerencie relatórios',
          description: 'Envie laudos e acompanhe validações',
          quickActions: [
            {
              title: 'Novo Relatório',
              description: 'Enviar um novo laudo',
              href: '/dashboard/reports/new',
              icon: Plus,
              color: 'bg-primary-500',
            },
            {
              title: 'Meus Relatórios',
              description: 'Ver todos os relatórios',
              href: '/dashboard/reports',
              icon: FileText,
              color: 'bg-green-500',
            },
          ],
        };
      case 'ADMIN':
        return {
          title: 'Administração',
          description: 'Gerencie validações, usuários e laboratórios',
          quickActions: [
            {
              title: 'Validações',
              description: 'Aprovar/rejeitar validações',
              href: '/dashboard/validations',
              icon: CheckCircle,
              color: 'bg-primary-500',
            },
            {
              title: 'Laboratórios',
              description: 'Gerenciar laboratórios',
              href: '/dashboard/laboratories',
              icon: Users,
              color: 'bg-purple-500',
            },
          ],
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Bem-vindo à plataforma',
          quickActions: [],
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getWelcomeMessage()}, {user?.name}!
        </h1>
        <p className="text-primary-100">
          {roleContent.description}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-hover p-6">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg transition-transform duration-200 hover:scale-110">
              <Package className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Produtos</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.products}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg transition-transform duration-200 hover:scale-110">
              <FileText className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Relatórios</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.reports}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg transition-transform duration-200 hover:scale-110">
              <CheckCircle className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Validações</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.validations}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg transition-transform duration-200 hover:scale-110">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Pendentes</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {roleContent.quickActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleContent.quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="card card-clickable p-6"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-md transition-colors duration-150 hover:bg-neutral-50">
                  <div className={`
                    p-2 rounded-full
                    ${activity.status === 'success' ? 'bg-green-100' : 'bg-blue-100'}
                  `}>
                    {activity.type === 'product' && (
                      <Package className={`h-4 w-4 ${
                        activity.status === 'success' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    )}
                    {activity.type === 'validation' && (
                      <CheckCircle className={`h-4 w-4 ${
                        activity.status === 'success' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    )}
                    {activity.type === 'report' && (
                      <FileText className={`h-4 w-4 ${
                        activity.status === 'success' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Gráficos em desenvolvimento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
