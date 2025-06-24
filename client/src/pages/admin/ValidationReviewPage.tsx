import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, User } from 'lucide-react';
import { Validation } from '@/types';
import { validationService } from '@/services/validationService';
import { toast } from 'react-hot-toast';

const ValidationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadValidation();
    }
  }, [id]);

  const loadValidation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await validationService.getValidation(id);
      setValidation(response.validation);
    } catch (error) {
      console.error('Erro ao carregar validação:', error);
      toast.error('Erro ao carregar validação');
      navigate('/dashboard/validations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!id || !validation) return;

    setUpdating(true);
    try {
      const response = await validationService.updateValidation(id, { status: newStatus });
      setValidation(response.validation);
      toast.success(`Validação ${newStatus === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando validação...</p>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Validação não encontrada</p>
        <button
          onClick={() => navigate('/dashboard/validations')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Validações
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard/validations')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revisar Validação</h1>
              <p className="text-gray-600 mt-1">
                {validation.product?.name || 'Produto'} - {validation.product?.brand || 'Marca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {validation.status !== 'APPROVED' && (
              <button
                onClick={() => handleStatusUpdate('APPROVED')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                disabled={updating}
              >
                <Check className="w-4 h-4 mr-1 inline" />
                Aprovar
              </button>
            )}
            {validation.status !== 'REJECTED' && (
              <button
                onClick={() => handleStatusUpdate('REJECTED')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                disabled={updating}
              >
                <X className="w-4 h-4 mr-1 inline" />
                Rejeitar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Validação</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Status Atual</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
              validation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              validation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              validation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {validation.status === 'APPROVED' ? 'Aprovado' :
               validation.status === 'REJECTED' ? 'Rejeitado' :
               validation.status === 'PENDING' ? 'Pendente' : validation.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tipo de Validação</p>
            <p className="text-gray-900 mt-1">{validation.type || 'MANUAL'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Data de Criação</p>
            <p className="text-gray-900 mt-1">
              {new Date(validation.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {validation.validatedAt && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                Validado em {new Date(validation.validatedAt).toLocaleDateString('pt-BR')} às {new Date(validation.validatedAt).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Produto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nome do Produto</p>
            <p className="text-gray-900 font-medium">{validation.product?.name || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Marca</p>
            <p className="text-gray-900 font-medium">{validation.product?.brand || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">SKU</p>
            <p className="text-gray-900 font-medium">{validation.product?.sku || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Categoria</p>
            <p className="text-gray-900 font-medium">{validation.product?.category || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Validation Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Validação</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">ID da Validação</p>
            <p className="text-gray-900 font-mono text-sm">{validation.id}</p>
          </div>

          {validation.summary && (
            <div>
              <p className="text-sm text-gray-600">Resumo</p>
              <p className="text-gray-900">{validation.summary}</p>
            </div>
          )}

          {validation.notes && (
            <div>
              <p className="text-sm text-gray-600">Observações</p>
              <p className="text-gray-700">{validation.notes}</p>
            </div>
          )}

          {validation.laboratory && (
            <div>
              <p className="text-sm text-gray-600">Laboratório</p>
              <p className="text-gray-900">{validation.laboratory}</p>
            </div>
          )}

          {validation.validator && (
            <div>
              <p className="text-sm text-gray-600">Validador</p>
              <div className="flex items-center mt-1">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{validation.validator}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline da Validação</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Validação Criada</p>
              <p className="text-sm text-gray-600">
                {new Date(validation.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {validation.requestedAt && (
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Validação Solicitada</p>
                <p className="text-sm text-gray-600">
                  {new Date(validation.requestedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {validation.validatedAt && (
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Validação Concluída</p>
                <p className="text-sm text-gray-600">
                  {new Date(validation.validatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationReviewPage;