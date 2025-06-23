import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supportService, WhatsAppConfig } from '@/services/supportService';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface WhatsAppIntegrationProps {
  onConfigured?: () => void;
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ onConfigured }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
  }>({ connected: false });
  const [showConfig, setShowConfig] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<WhatsAppConfig>();

  const { execute: checkStatus, loading: checkingStatus } = useAsyncAction(async () => {
    const result = await supportService.getWhatsAppStatus();
    setStatus(result);
    
    if (result.connected) {
      const templateList = await supportService.getWhatsAppTemplates();
      setTemplates(templateList);
    }
  });

  const { execute: saveConfig, loading: savingConfig } = useAsyncAction(async (data: WhatsAppConfig) => {
    await supportService.configureWhatsApp(data);
    await checkStatus();
    setShowConfig(false);
    onConfigured?.();
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const onSubmit = (data: WhatsAppConfig) => {
    saveConfig(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold">WhatsApp Business Integration</h3>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          {status.connected ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-700 font-medium">Conectado</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-500" size={20} />
              <span className="text-red-700 font-medium">Desconectado</span>
            </>
          )}
          <button
            onClick={() => checkStatus()}
            disabled={checkingStatus}
            className="ml-auto text-blue-600 hover:text-blue-700"
          >
            <RefreshCw size={16} className={checkingStatus ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {status.connected && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>Número: {status.phoneNumber}</p>
            <p>Empresa: {status.businessName}</p>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      {showConfig && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 123456789012345"
              {...register('businessId', { required: 'Business ID é obrigatório' })}
            />
            {errors.businessId && (
              <p className="text-red-500 text-xs mt-1">{errors.businessId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 987654321098765"
              {...register('phoneNumberId', { required: 'Phone Number ID é obrigatório' })}
            />
            {errors.phoneNumberId && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumberId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Token de acesso da API"
              {...register('accessToken', { required: 'Access Token é obrigatório' })}
            />
            {errors.accessToken && (
              <p className="text-red-500 text-xs mt-1">{errors.accessToken.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verify Token
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Token de verificação do webhook"
              {...register('verifyToken', { required: 'Verify Token é obrigatório' })}
            />
            {errors.verifyToken && (
              <p className="text-red-500 text-xs mt-1">{errors.verifyToken.message}</p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={savingConfig}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {savingConfig ? 'Salvando...' : 'Salvar Configuração'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Templates */}
      {status.connected && templates.length > 0 && !showConfig && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Templates Disponíveis</h4>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                <p className="font-medium">{template.name}</p>
                <p className="text-gray-600 text-xs">{template.language}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Como configurar:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Acesse o Meta Business Suite</li>
          <li>Vá para WhatsApp → Configurações da API</li>
          <li>Copie os IDs e tokens necessários</li>
          <li>Configure o webhook URL: {window.location.origin}/api/whatsapp/webhook</li>
        </ol>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;