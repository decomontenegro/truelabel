import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, Plus, Filter, RefreshCw, Bot, Users, List, BarChart2 } from 'lucide-react';
import { Validation, ValidationQueue, ValidationMetrics } from '@/types';
import { validationService } from '@/services/validationService';
import { productService } from '@/services/productService';
import { reportService } from '@/services/reportService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ValidationQueueComponent } from '@/components/validations/ValidationQueue';
import { AutomatedValidationStatus } from '@/components/validations/AutomatedValidationStatus';
import { DataPointsReview } from '@/components/validations/DataPointsReview';
import { ValidationFeedbackComponent } from '@/components/validations/ValidationFeedback';

export const ValidationsPage: React.FC = () => {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'queue' | 'metrics'>('list');
  const [queue, setQueue] = useState<ValidationQueue[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const navigate = useNavigate();

  // Carregar validações
  const loadValidations = async () => {
    try {
      setLoading(true);
      const filters: any = { limit: 100 };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const response = await validationService.getValidations(filters);
      setValidations(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar validações');
    } finally {
      setLoading(false);
    }
  };

  // Carregar fila de validações
  const loadQueue = async () => {
    try {
      const response = await validationService.getValidationQueue();
      setQueue(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  // Carregar métricas
  const loadMetrics = async () => {
    try {
      const response = await validationService.getValidationMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  useEffect(() => {
    loadValidations();
    loadQueue();
    loadMetrics();
  }, [statusFilter]);

  useEffect(() => {
    // Atualizar fila a cada 30 segundos
    const interval = setInterval(() => {
      if (activeTab === 'queue') {
        loadQueue();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PARTIAL':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'IN_PROGRESS':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validações</h1>
          <p className="text-gray-600">Gerencie validações de produtos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/validations/queue')}
            className="btn btn-secondary"
          >
            <List className="w-4 h-4 mr-2" />
            Fila
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Validação
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Lista de Validações
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'queue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <List className="w-4 h-4 inline-block mr-2" />
            Fila de Processamento
            {queue.filter(q => q.status === 'QUEUED' || q.status === 'PROCESSING').length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {queue.filter(q => q.status === 'QUEUED' || q.status === 'PROCESSING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 className="w-4 h-4 inline-block mr-2" />
            Métricas e Análises
          </button>
        </nav>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-48"
              >
                <option value="all">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="IN_PROGRESS">Em Processamento</option>
                <option value="APPROVED">Aprovados</option>
                <option value="REJECTED">Rejeitados</option>
                <option value="PARTIAL">Parciais</option>
              </select>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validations.filter(v => v.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <RefreshCw className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Processando</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validations.filter(v => v.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validations.filter(v => v.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Rejeitados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validations.filter(v => v.status === 'REJECTED').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Parciais</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validations.filter(v => v.status === 'PARTIAL').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Validações */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confiança
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validations.map((validation) => (
                <tr key={validation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {validation.product?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {validation.product?.brand} • {validation.product?.sku}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {validation.type === 'AUTOMATED' && (
                        <Bot className="w-4 h-4 text-blue-600 mr-2" />
                      )}
                      <span className="text-sm text-gray-900">
                        {validation.type === 'AUTOMATED' && 'Automatizada'}
                        {validation.type === 'MANUAL' && 'Manual'}
                        {validation.type === 'LABORATORY' && 'Laboratorial'}
                        {validation.type === 'HYBRID' && 'Híbrida'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(validation.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(validation.status)}`}>
                        {validation.status === 'APPROVED' && 'Aprovado'}
                        {validation.status === 'REJECTED' && 'Rejeitado'}
                        {validation.status === 'PARTIAL' && 'Parcial'}
                        {validation.status === 'PENDING' && 'Pendente'}
                        {validation.status === 'IN_PROGRESS' && 'Processando'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {validation.confidence !== undefined && (
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              validation.confidence >= 80 ? 'bg-green-600' :
                              validation.confidence >= 60 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${validation.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{validation.confidence}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {validation.user?.name || 'Sistema'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(validation.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/admin/validations/${validation.id}/review`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>

          {/* Estado vazio */}
          {validations.length === 0 && !loading && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma validação encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            {statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando a primeira validação'
            }
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Validação
            </button>
          )}
        </div>
          )}
        </>
      )}

      {/* Tab de Fila */}
      {activeTab === 'queue' && (
        <ValidationQueueComponent
          queue={queue}
          onRefresh={loadQueue}
        />
      )}

      {/* Tab de Métricas */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          {/* Métricas de Automação */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Automação</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Taxa de Automação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.automatedPercentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Médio de Processamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(metrics.averageProcessingTime / 1000).toFixed(1)}s
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Precisão</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.accuracyRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Revalidação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.revalidationRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Distribuição por Tipo */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Tipo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.byType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-sm text-gray-600">
                    {type === 'AUTOMATED' && 'Automatizada'}
                    {type === 'MANUAL' && 'Manual'}
                    {type === 'LABORATORY' && 'Laboratorial'}
                    {type === 'HYBRID' && 'Híbrida'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tendência dos Últimos 30 Dias */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência dos Últimos 30 Dias</h3>
            <div className="space-y-2">
              {metrics.trendsLast30Days.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{trend.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      <Bot className="w-4 h-4 inline text-blue-600 mr-1" />
                      {trend.automated}
                    </span>
                    <span className="text-sm">
                      <Users className="w-4 h-4 inline text-gray-600 mr-1" />
                      {trend.manual}
                    </span>
                    <span className="text-sm font-medium">
                      Total: {trend.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateValidationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadValidations();
          }}
        />
      )}
    </div>
  );
};

// Modal de Criação de Validação
const CreateValidationModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    productId: '',
    reportId: '',
    type: 'MANUAL' as 'MANUAL' | 'LABORATORY' | 'AUTOMATED' | 'HYBRID',
    status: 'APPROVED' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIAL',
    claimsValidated: {} as Record<string, any>,
    summary: '',
    notes: '',
    useAutomation: false
  });
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar produtos e relatórios
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, reportsRes] = await Promise.all([
          productService.getProducts({ limit: 100 }),
          reportService.getReports({ limit: 100 })
        ]);
        setProducts(productsRes.data);
        setReports(reportsRes.data);
      } catch (error) {
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = {
        ...formData,
        claimsValidated: formData.claimsValidated || {}
      };


      await validationService.createValidation(validationData);
      toast.success('Validação criada com sucesso!');
      onSuccess();
    } catch (error: any) {

      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao criar validação';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nova Validação</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className="input w-full"
              required
            >
              <option value="">Selecione um produto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Validação *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any, reportId: e.target.value === 'MANUAL' ? '' : prev.reportId }))}
              className="input w-full"
              required
            >
              <option value="MANUAL">Manual (sem relatório)</option>
              <option value="LABORATORY">Laboratorial (com relatório)</option>
              <option value="AUTOMATED">Automatizada (IA)</option>
              <option value="HYBRID">Híbrida (IA + Revisão)</option>
            </select>
          </div>

          {(formData.type === 'AUTOMATED' || formData.type === 'HYBRID') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Bot className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Validação Automatizada
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    O sistema irá analisar automaticamente o relatório usando IA para extrair e validar os dados.
                    {formData.type === 'HYBRID' && ' Os resultados serão revisados antes da aprovação final.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(formData.type === 'LABORATORY' || formData.type === 'AUTOMATED' || formData.type === 'HYBRID') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relatório *
              </label>
              <select
                value={formData.reportId}
                onChange={(e) => setFormData(prev => ({ ...prev, reportId: e.target.value }))}
                className="input w-full"
                required={formData.type !== 'MANUAL'}
              >
                <option value="">Selecione um relatório</option>
                {reports.map(report => (
                  <option key={report.id} value={report.id}>
                    {report.originalName} - {report.laboratory?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="input w-full"
              required
            >
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="PARTIAL">Parcial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resumo
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="Resumo da validação..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Validação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ValidationsPage;
