/**
 * Validation Queue Dashboard Component
 * 
 * Purpose: Display and manage validation queue for administrators
 * Dependencies: React, WebSocket hook, Validation Queue API
 * 
 * Features:
 * - Real-time queue updates
 * - Assignment management
 * - Status tracking
 * - Filtering and sorting
 * - Metrics display
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { validationQueueService } from '@/services/validationQueueService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QueueEntry {
  id: string;
  productId: string;
  status: string;
  priority: string;
  category: string;
  estimatedDuration: number;
  dueDate: string;
  createdAt: string;
  product: {
    name: string;
    brand: string;
    user: {
      name: string;
      email: string;
    };
  };
  requestedBy: {
    name: string;
    email: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
}

interface QueueMetrics {
  totalPending: number;
  totalAssigned: number;
  totalInProgress: number;
  totalCompleted: number;
  avgProcessingTime: number;
  overdueCount: number;
  totalActive: number;
}

const ValidationQueueDashboard: React.FC = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // WebSocket for real-time updates
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    loadQueue();
    loadMetrics();
    
    // Subscribe to real-time updates
    if (isConnected) {
      subscribe('queue-update', handleQueueUpdate);
      subscribe('queue-entry-created', handleQueueUpdate);
      subscribe('queue-entry-assigned', handleQueueUpdate);
      subscribe('queue-entry-updated', handleQueueUpdate);
    }

    return () => {
      unsubscribe('queue-update');
      unsubscribe('queue-entry-created');
      unsubscribe('queue-entry-assigned');
      unsubscribe('queue-entry-updated');
    };
  }, [isConnected]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await validationQueueService.getQueue(filters);
      setQueue(response.data.queue);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await validationQueueService.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleQueueUpdate = (data: any) => {
    console.log('Queue update received:', data);
    loadQueue();
    loadMetrics();
  };

  const handleAssignValidation = async (queueId: string, assignedToId: string) => {
    try {
      await validationQueueService.assignValidation(queueId, assignedToId);
      setAssignModalOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to assign validation:', error);
    }
  };

  const handleStatusUpdate = async (queueId: string, newStatus: string, reason?: string) => {
    try {
      await validationQueueService.updateStatus(queueId, newStatus, reason);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ASSIGNED':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'IN_PROGRESS':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading && queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Carregando fila de validação...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fila de Validação</h1>
          <p className="text-gray-600">Gerencie e acompanhe validações pendentes</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
          <button
            onClick={loadQueue}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalInProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCompleted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgProcessingTime}min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="ASSIGNED">Atribuído</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluído</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="Filtrar por categoria"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar produto..."
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={loadQueue}
            className="btn btn-primary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atribuído a
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prazo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queue.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.product.brand} • {entry.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(entry.status)}
                      <span className="ml-2 text-sm text-gray-900">
                        {entry.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(entry.priority)}`}>
                      {entry.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.assignedTo ? entry.assignedTo.name : 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isOverdue(entry.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDistanceToNow(new Date(entry.dueDate), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                      {isOverdue(entry.dueDate) && (
                        <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {entry.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setAssignModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Atribuir
                        </button>
                      )}
                      {entry.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleStatusUpdate(entry.id, 'IN_PROGRESS')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Iniciar
                        </button>
                      )}
                      {entry.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusUpdate(entry.id, 'COMPLETED')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {queue.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma validação na fila</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas as validações foram processadas ou não há solicitações pendentes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationQueueDashboard;
