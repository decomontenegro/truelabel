import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Download,
  Trash2,
  Edit,
  FileText,
  Cookie,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface PrivacyRequest {
  id: string;
  type: string;
  status: string;
  reason?: string;
  requestedAt: string;
  completedAt?: string;
}

interface ConsentStatus {
  marketing: boolean;
  analytics: boolean;
  consents: any[];
}

export default function PrivacyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [consents, setConsents] = useState<ConsentStatus | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPrivacyData();
  }, [user, navigate]);

  const loadPrivacyData = async () => {
    try {
      const [requestsRes, consentsRes] = await Promise.all([
        api.get('/privacy/requests'),
        api.get('/privacy/consents')
      ]);

      setRequests(requestsRes.data.requests);
      setConsents(consentsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados de privacidade');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      const response = await api.get(`/privacy/data/export?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-truelabel.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason || !confirmEmail) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (confirmEmail !== user?.email) {
      toast.error('O email de confirmação não corresponde');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/privacy/data/delete', {
        reason: deleteReason,
        confirmEmail
      });

      toast.success('Solicitação de exclusão processada. Você receberá um email de confirmação.');
      setShowDeleteModal(false);
      
      // Logout after deletion request
      setTimeout(() => {
        useAuthStore.getState().logout();
        navigate('/');
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const updateConsent = async (type: 'marketing' | 'analytics', value: boolean) => {
    try {
      await api.post('/privacy/consents', {
        consents: {
          [type]: value
        }
      });

      toast.success('Preferências atualizadas');
      loadPrivacyData();
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Central de Privacidade</h1>
        <p className="mt-2 text-gray-600">
          Gerencie seus dados pessoais e preferências de privacidade
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowDataModal(true)}>
          <Download className="h-8 w-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold">Exportar Dados</h3>
          <p className="text-sm text-gray-600 mt-1">Baixe seus dados pessoais</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/settings/profile')}>
          <Edit className="h-8 w-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold">Editar Dados</h3>
          <p className="text-sm text-gray-600 mt-1">Atualize suas informações</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.open('/privacy-policy', '_blank')}>
          <FileText className="h-8 w-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold">Política de Privacidade</h3>
          <p className="text-sm text-gray-600 mt-1">Leia nossa política</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="h-8 w-8 text-red-600 mx-auto mb-3" />
          <h3 className="font-semibold text-red-600">Excluir Conta</h3>
          <p className="text-sm text-gray-600 mt-1">Remova todos seus dados</p>
        </Card>
      </div>

      {/* Consent Preferences */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Cookie className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold">Preferências de Cookies</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies Necessários</h3>
                <p className="text-sm text-gray-600">
                  Essenciais para o funcionamento do site
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-3">Sempre ativos</span>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-5 w-5 text-primary-600 rounded cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies Analíticos</h3>
                <p className="text-sm text-gray-600">
                  Nos ajudam a melhorar o site através de estatísticas
                </p>
              </div>
              <input
                type="checkbox"
                checked={consents?.analytics || false}
                onChange={(e) => updateConsent('analytics', e.target.checked)}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Cookies de Marketing</h3>
                <p className="text-sm text-gray-600">
                  Usados para personalizar anúncios e conteúdo
                </p>
              </div>
              <input
                type="checkbox"
                checked={consents?.marketing || false}
                onChange={(e) => updateConsent('marketing', e.target.checked)}
                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Requests History */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold">Histórico de Solicitações</h2>
          </div>

          {requests.length === 0 ? (
            <p className="text-gray-600">Nenhuma solicitação de privacidade registrada.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {request.status === 'COMPLETED' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    ) : request.status === 'REJECTED' ? (
                      <X className="h-5 w-5 text-red-600 mr-3" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">
                        {request.type === 'DELETION' && 'Exclusão de Dados'}
                        {request.type === 'ACCESS' && 'Acesso aos Dados'}
                        {request.type === 'RECTIFICATION' && 'Retificação de Dados'}
                        {request.type === 'PORTABILITY' && 'Portabilidade de Dados'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Solicitado em {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status === 'COMPLETED' && 'Concluída'}
                    {request.status === 'REJECTED' && 'Rejeitada'}
                    {request.status === 'PENDING' && 'Pendente'}
                    {request.status === 'IN_PROGRESS' && 'Em Progresso'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Export Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDataModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Exportar Dados Pessoais</h2>
              
              <p className="text-gray-600 mb-6">
                Escolha o formato para exportar seus dados pessoais. O arquivo conterá todas as informações
                que temos sobre você.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleExportData('json');
                    setShowDataModal(false);
                  }}
                  className="flex-1"
                >
                  Exportar JSON
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleExportData('csv');
                    setShowDataModal(false);
                  }}
                  className="flex-1"
                >
                  Exportar CSV
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowDataModal(false)}
                className="w-full mt-3"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDeleteModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold">Excluir Conta</h2>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Atenção:</strong> Esta ação é irreversível. Todos os seus dados serão permanentemente
                  removidos de nossos sistemas, incluindo:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  <li>Informações pessoais</li>
                  <li>Produtos e validações</li>
                  <li>Histórico de atividades</li>
                  <li>Acesso à plataforma</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da exclusão
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    placeholder="Por favor, nos diga por que está excluindo sua conta..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirme seu email
                  </label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder={user?.email}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  loading={processing}
                  className="flex-1"
                >
                  Excluir Permanentemente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}