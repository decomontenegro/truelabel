import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { ValidationFeedback } from '@/types';
import { toast } from 'react-hot-toast';

interface ValidationFeedbackProps {
  validationId: string;
  feedback: ValidationFeedback[];
  onSubmitFeedback?: (feedback: Omit<ValidationFeedback, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  currentUserId?: string;
}

export const ValidationFeedbackComponent: React.FC<ValidationFeedbackProps> = ({ 
  validationId,
  feedback, 
  onSubmitFeedback,
  currentUserId 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'SUGGESTION' as 'CORRECTION' | 'CONFIRMATION' | 'DISPUTE' | 'SUGGESTION',
    message: '',
    dataPointId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CORRECTION':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'CONFIRMATION':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'DISPUTE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'SUGGESTION':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CORRECTION': return 'Correção';
      case 'CONFIRMATION': return 'Confirmação';
      case 'DISPUTE': return 'Contestação';
      case 'SUGGESTION': return 'Sugestão';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitFeedback || !formData.message.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitFeedback({
        userId: currentUserId || '',
        validationId,
        type: formData.type,
        message: formData.message,
        dataPointId: formData.dataPointId || undefined
      });
      
      toast.success('Feedback enviado com sucesso!');
      setFormData({
        type: 'SUGGESTION',
        message: '',
        dataPointId: ''
      });
      setShowForm(false);
    } catch (error) {
      toast.error('Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Feedback e Comunicação</h3>
            <p className="text-sm text-gray-600 mt-1">
              {feedback.length} mensagens
            </p>
          </div>
          {!showForm && onSubmitFeedback && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Novo Feedback
            </button>
          )}
        </div>
      </div>

      {/* Feedback Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Enviar Feedback</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Feedback
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="input w-full"
                required
              >
                <option value="SUGGESTION">Sugestão</option>
                <option value="CORRECTION">Correção</option>
                <option value="CONFIRMATION">Confirmação</option>
                <option value="DISPUTE">Contestação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="input w-full"
                rows={4}
                placeholder="Descreva seu feedback..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                {getTypeIcon(item.type)}
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.userName || 'Usuário'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'PENDING' && 'Pendente'}
                      {item.status === 'REVIEWED' && 'Revisado'}
                      {item.status === 'RESOLVED' && 'Resolvido'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2">
                    {item.message}
                  </p>

                  {item.resolution && (
                    <div className="mt-3 bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Resolução:</p>
                      <p className="text-sm text-gray-700">{item.resolution}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                {item.resolvedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Resolvido em {new Date(item.resolvedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            {item.status === 'PENDING' && (
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Aguardando revisão
              </div>
            )}
          </div>
        ))}

        {feedback.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum feedback ainda
            </h3>
            <p className="text-sm text-gray-600">
              Seja o primeiro a fornecer feedback sobre esta validação
            </p>
          </div>
        )}
      </div>
    </div>
  );
};