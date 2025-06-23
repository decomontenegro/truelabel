import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ValidationQueue } from '@/types';
import { validationService } from '@/services/validationService';
import { ValidationQueueComponent } from '@/components/validations/ValidationQueue';

export const ValidationQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<ValidationQueue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await validationService.getValidationQueue();
      setQueue(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/validations')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fila de Validações</h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o processamento automatizado de validações
            </p>
          </div>
        </div>
      </div>

      {/* Queue Component */}
      <ValidationQueueComponent
        queue={queue}
        onRefresh={loadQueue}
      />
    </div>
  );
};

export default ValidationQueuePage;