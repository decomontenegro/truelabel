import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Clock, Calendar, Settings, X, Check } from 'lucide-react';
import { CertificationAlert } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ExpirationAlertsProps {
  productId?: string;
  showSettings?: boolean;
}

const ExpirationAlerts: React.FC<ExpirationAlertsProps> = ({ productId, showSettings = true }) => {
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    expirationWarningDays: 30,
    emailNotifications: true,
    dashboardNotifications: true
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAlerts();
  }, [productId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await certificationService.getCertificationAlerts({ 
        productId,
        isRead: false 
      });
      setAlerts(alertsData);
      setUnreadCount(alertsData.filter(a => !a.isRead).length);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await certificationService.markAlertAsRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Erro ao marcar alerta como lido');
    }
  };

  const saveSettings = async () => {
    try {
      await certificationService.configureAlertSettings(settings);
      toast.success('Configurações salvas com sucesso!');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'EXPIRING_SOON':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'EXPIRED':
        return { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'RENEWAL_REQUIRED':
        return { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'VERIFICATION_FAILED':
        return { icon: X, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'DOCUMENT_MISSING':
        return { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'EXPIRING_SOON': return 'Expirando em Breve';
      case 'EXPIRED': return 'Expirado';
      case 'RENEWAL_REQUIRED': return 'Renovação Necessária';
      case 'VERIFICATION_FAILED': return 'Falha na Verificação';
      case 'DOCUMENT_MISSING': return 'Documento Ausente';
      default: return type;
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Alertas de Certificação
            </h3>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {showSettings && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum alerta no momento</p>
            <p className="text-sm text-gray-500 mt-1">
              Você será notificado quando houver certificações expirando
            </p>
          </div>
        ) : (
          alerts.map(alert => {
            const { icon: Icon, color, bgColor } = getAlertIcon(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !alert.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getAlertTypeLabel(alert.type)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                      
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="ml-3 text-gray-400 hover:text-gray-600"
                          title="Marcar como lido"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Configurações de Alertas
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avisar com quantos dias de antecedência?
                </label>
                <select
                  value={settings.expirationWarningDays}
                  onChange={(e) => setSettings({
                    ...settings,
                    expirationWarningDays: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailNotifications: e.target.checked
                    })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Receber notificações por e-mail
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.dashboardNotifications}
                    onChange={(e) => setSettings({
                      ...settings,
                      dashboardNotifications: e.target.checked
                    })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Mostrar notificações no dashboard
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={saveSettings}
                className="btn btn-primary"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpirationAlerts;