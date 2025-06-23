import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Paperclip, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface SupportTicketForm {
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  productCode?: string;
  orderNumber?: string;
  attachments?: FileList;
}

interface SupportTicketProps {
  productId?: string;
  onSuccess?: () => void;
}

const SupportTicket: React.FC<SupportTicketProps> = ({ productId, onSuccess }) => {
  const { user } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<SupportTicketForm>({
    defaultValues: {
      productCode: productId || '',
      priority: 'medium'
    }
  });

  const { execute: submitTicket, loading } = useAsyncAction(async (data: SupportTicketForm) => {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'attachments') {
        formData.append(key, value.toString());
      }
    });

    // Add user info if available
    if (user) {
      formData.append('userId', user.id);
      formData.append('userEmail', user.email);
      formData.append('userName', user.name);
    }

    // Add attachments
    uploadedFiles.forEach((file, index) => {
      formData.append(`attachments`, file);
    });

    // Mock API call - replace with actual endpoint
    await api.post('/support/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setSubmitStatus('success');
    reset();
    setUploadedFiles([]);
    
    if (onSuccess) {
      setTimeout(onSuccess, 2000);
    }
  });

  const categories = [
    { value: 'authentication', label: 'Autenticação de Produto' },
    { value: 'quality', label: 'Qualidade do Produto' },
    { value: 'delivery', label: 'Entrega/Logística' },
    { value: 'warranty', label: 'Garantia' },
    { value: 'counterfeit', label: 'Suspeita de Falsificação' },
    { value: 'technical', label: 'Problema Técnico' },
    { value: 'other', label: 'Outro' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: 'text-green-600' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600' },
    { value: 'high', label: 'Alta', color: 'text-red-600' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SupportTicketForm) => {
    setSubmitStatus('idle');
    await submitTicket(data);
  };

  if (submitStatus === 'success') {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ticket Criado com Sucesso!
        </h3>
        <p className="text-gray-600 mb-4">
          Seu ticket foi registrado e nossa equipe entrará em contato em breve.
        </p>
        <p className="text-sm text-gray-500">
          Você receberá um e-mail com o número do ticket e atualizações sobre o atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* User Info (if not logged in) */}
          {!user && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertCircle className="inline mr-2" size={16} />
                Você não está logado. Por favor, forneça seu e-mail para contato.
              </p>
              <input
                type="email"
                placeholder="Seu e-mail"
                className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('userEmail', { 
                  required: !user && 'E-mail é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'E-mail inválido'
                  }
                })}
              />
              {errors.userEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.userEmail.message}</p>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assunto *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva brevemente o problema"
              {...register('subject', { required: 'Assunto é obrigatório' })}
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('category', { required: 'Categoria é obrigatória' })}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <div className="flex space-x-4">
              {priorityOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    value={option.value}
                    {...register('priority')}
                    className="mr-2"
                  />
                  <span className={`text-sm ${option.color}`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código do Produto
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: ABC123 (opcional)"
              {...register('productCode')}
            />
          </div>

          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Pedido
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: #12345 (opcional)"
              {...register('orderNumber')}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o problema em detalhes..."
              {...register('description', { 
                required: 'Descrição é obrigatória',
                minLength: { value: 20, message: 'Descrição deve ter pelo menos 20 caracteres' }
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anexos (opcional)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <Paperclip className="mr-2" size={20} />
                <span className="text-sm text-gray-600">Adicionar arquivos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Formatos aceitos: imagens, PDF, DOC, DOCX (máx. 10MB cada)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t bg-gray-50">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2" size={18} />
                Enviar Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportTicket;