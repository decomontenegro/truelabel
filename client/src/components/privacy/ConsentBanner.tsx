import React, { useState, useEffect } from 'react';
import { X, Shield, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      // Check localStorage first
      const localConsent = localStorage.getItem('cookieConsent');
      if (localConsent && !user) {
        // Anonymous user with existing consent
        return;
      }

      if (user) {
        // Logged in user - check server consent
        const response = await api.get('/privacy/consents');
        const { consents } = response.data;
        
        if (!consents || consents.length === 0) {
          setIsVisible(true);
        } else {
          // Apply existing preferences
          setPreferences({
            necessary: true,
            analytics: consents.analytics || false,
            marketing: consents.marketing || false
          });
        }
      } else {
        // Anonymous user without consent
        if (!localConsent) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking consent:', error);
      setIsVisible(true);
    }
  };

  const handleAcceptAll = async () => {
    await saveConsent({
      necessary: true,
      analytics: true,
      marketing: true
    });
  };

  const handleAcceptSelected = async () => {
    await saveConsent(preferences);
  };

  const handleRejectAll = async () => {
    await saveConsent({
      necessary: true,
      analytics: false,
      marketing: false
    });
  };

  const saveConsent = async (consents: ConsentPreferences) => {
    setLoading(true);
    try {
      if (user) {
        // Save to server for logged in users
        await api.post('/privacy/consents', {
          consents: {
            analytics: consents.analytics,
            marketing: consents.marketing
          }
        });
      }

      // Save to localStorage for all users
      localStorage.setItem('cookieConsent', JSON.stringify({
        consents,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));

      // Apply consent preferences
      applyConsentPreferences(consents);

      setIsVisible(false);
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyConsentPreferences = (consents: ConsentPreferences) => {
    // Google Analytics
    if (consents.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Marketing cookies
    if (consents.marketing && window.fbq) {
      window.fbq('consent', 'grant');
    } else if (window.fbq) {
      window.fbq('consent', 'revoke');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Cookie className="h-6 w-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Configurações de Cookies e Privacidade
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
          Ao clicar em "Aceitar todos", você concorda com o uso de TODOS os cookies. 
          Você pode gerenciar suas preferências clicando em "Personalizar".
        </p>

        {showDetails && (
          <div className="mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-green-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Cookies Necessários</h4>
                    <span className="ml-2 text-xs text-gray-500">(Sempre ativos)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Essenciais para o funcionamento do site. Incluem autenticação, segurança e preferências básicas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="h-4 w-4 text-primary-600 rounded cursor-not-allowed"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Cookies Analíticos</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Nos ajudam a entender como os visitantes interagem com o site, coletando informações anonimamente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Cookies de Marketing</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Usados para rastrear visitantes em sites e exibir anúncios relevantes e envolventes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Ler nossa Política de Privacidade completa
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800"
          >
            <span>Personalizar preferências</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>

          <div className="flex flex-1 gap-3 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              disabled={loading}
            >
              Rejeitar todos
            </Button>
            
            {showDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptSelected}
                disabled={loading}
              >
                Aceitar selecionados
              </Button>
            )}
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptAll}
              disabled={loading}
            >
              Aceitar todos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cookie Settings Modal Component
export const CookieSettings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      loadCurrentPreferences();
    }
  }, [isOpen]);

  const loadCurrentPreferences = async () => {
    try {
      if (user) {
        const response = await api.get('/privacy/consents');
        const { consents } = response.data;
        setPreferences({
          necessary: true,
          analytics: consents.analytics || false,
          marketing: consents.marketing || false
        });
      } else {
        const localConsent = localStorage.getItem('cookieConsent');
        if (localConsent) {
          const { consents } = JSON.parse(localConsent);
          setPreferences(consents);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user) {
        await api.post('/privacy/consents', {
          consents: {
            analytics: preferences.analytics,
            marketing: preferences.marketing
          }
        });
      }

      localStorage.setItem('cookieConsent', JSON.stringify({
        consents: preferences,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));

      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-semibold mb-4">Configurações de Cookies</h2>
          
          <div className="space-y-4">
            {/* Cookie preferences UI similar to the banner */}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              Salvar preferências
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Type definitions for external scripts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}