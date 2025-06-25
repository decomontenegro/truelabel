import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Users, Save, Send, Check, X } from 'lucide-react';
import { Validation, ValidationFeedback as FeedbackType } from '@/types';
import { validationService } from '@/services/validationService';
import { AutomatedValidationStatus } from '@/components/validations/AutomatedValidationStatus';
import { DataPointsReview } from '@/components/validations/DataPointsReview';
import { ValidationFeedbackComponent } from '@/components/validations/ValidationFeedback';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export const ValidationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [validation, setValidation] = useState<Validation | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data-points' | 'ai-analysis' | 'feedback'>('overview');

  useEffect(() => {
    if (id) {
      loadValidation();
      loadFeedback();
    }
  }, [id]);

  const loadValidation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await validationService.getValidation(id);
      setValidation(response.validation);
    } catch (error) {
      toast.error('Erro ao carregar validação');
      navigate('/admin/validations');
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    if (!id) return;
    
    try {
      const response = await validationService.getValidationFeedback(id);
      setFeedback(response.data);
    } catch (error) {
      console.error('Erro ao carregar feedback:', error);
    }
  };

  const handleDataPointsUpdate = async (dataPoints: any[]) => {
    if (!id) return;
    
    setSaving(true);
    try {
      const response = await validationService.updateValidationDataPoints(id, dataPoints);
      setValidation(response.data);
      toast.success('Pontos de dados atualizados!');
    } catch (error) {
      toast.error('Erro ao atualizar pontos de dados');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    
    setSaving(true);
    try {
      const response = await validationService.updateValidation(id, { status: newStatus as any });
      setValidation(response.validation);
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async (feedbackData: Omit<FeedbackType, 'id' | 'createdAt' | 'status'>) => {
    if (!id) return;
    
    const response = await validationService.submitValidationFeedback(id, {
      ...feedbackData,
      userId: user?.id || '',
      userName: user?.name
    });
    
    setFeedback([...feedback, response.data]);
    await loadFeedback();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!validation) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/validations')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revisar Validação</h1>
              <p className="text-gray-600 mt-1">
                {validation.product?.name} - {validation.product?.brand}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {validation.type === 'AUTOMATED' && (
              <div className="flex items-center text-blue-600">
                <Bot className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Validação Automatizada</span>
              </div>
            )}
            {validation.confidence !== undefined && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{validation.confidence}%</p>
                <p className="text-xs text-gray-600">Confiança</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('data-points')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'data-points'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pontos de Dados
            {validation.dataPoints && validation.dataPoints.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {validation.dataPoints.length}
              </span>
            )}
          </button>
          {(validation.type === 'AUTOMATED' || validation.type === 'HYBRID') && (
            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai-analysis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="w-4 h-4 inline-block mr-1" />
              Análise IA
            </button>
          )}
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feedback
            {feedback.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {feedback.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status e Ações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status Atual</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    validation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    validation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    validation.status === 'PARTIAL' ? 'bg-orange-100 text-orange-800' :
                    validation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {validation.status}
                  </span>
                  {validation.validatedAt && (
                    <span className="text-sm text-gray-500">
                      Validado em {new Date(validation.validatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Ações Rápidas</p>
                <div className="flex gap-2">
                  {validation.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleStatusUpdate('APPROVED')}
                      className="btn btn-success btn-sm"
                      disabled={saving}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </button>
                  )}
                  {validation.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleStatusUpdate('REJECTED')}
                      className="btn btn-danger btn-sm"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {validation.summary && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Resumo</p>
                <p className="text-gray-900">{validation.summary}</p>
              </div>
            )}

            {validation.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Observações</p>
                <p className="text-gray-700">{validation.notes}</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Produto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="text-gray-900">{validation.product?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="text-gray-900">{validation.product?.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">SKU</p>
                <p className="text-gray-900">{validation.product?.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="text-gray-900">{validation.product?.category}</p>
              </div>
            </div>

            {validation.product?.claims && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Claims</p>
                <div className="flex flex-wrap gap-2">
                  {validation.product.claims.split(',').map((claim, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {claim.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report Info */}
          {validation.report && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatório Laboratorial</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Laboratório</p>
                  <p className="text-gray-900">{validation.report.laboratory?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Acreditação</p>
                  <p className="text-gray-900">{validation.report.laboratory?.accreditation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Análise</p>
                  <p className="text-gray-900">{validation.report.analysisType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data do Relatório</p>
                  <p className="text-gray-900">
                    {new Date(validation.report.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'data-points' && validation.dataPoints && (
        <DataPointsReview
          dataPoints={validation.dataPoints}
          onUpdate={handleDataPointsUpdate}
          readOnly={validation.status === 'APPROVED'}
        />
      )}

      {activeTab === 'ai-analysis' && validation.automatedAnalysis && (
        <AutomatedValidationStatus
          validation={validation}
          analysis={validation.automatedAnalysis}
        />
      )}

      {activeTab === 'feedback' && (
        <ValidationFeedbackComponent
          validationId={id!}
          feedback={feedback}
          onSubmitFeedback={handleSubmitFeedback}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};