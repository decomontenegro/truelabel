import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Building,
  Calendar,
  Info,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { QRValidationResponse } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, getStatusColor, getStatusText } from '@/lib/utils';
import config from '@/config/env';
import { qrValidationLimiter, useRateLimiter } from '@/lib/rateLimiter';

// Helper function to convert claims string to array
const getClaimsArray = (claims: string | string[] | null | undefined): string[] => {
  if (!claims) return [];
  if (Array.isArray(claims)) return claims;
  if (typeof claims === 'string') {
    return claims.split(',').map(claim => claim.trim()).filter(claim => claim.length > 0);
  }
  return [];
};

const ValidationPublicPage = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<QRValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rate limiting
  const { checkLimit, isBlocked, timeUntilReset } = useRateLimiter(
    qrValidationLimiter,
    `qr-validation-${qrCode || 'unknown'}`,
    'Muitas validações. Aguarde um momento antes de tentar novamente.'
  );

  useEffect(() => {
    const fetchValidation = async () => {
      if (!qrCode) {
        return;
      }

      // Verificar rate limiting
      if (!checkLimit()) {
        setError(`Muitas tentativas. Aguarde ${timeUntilReset} segundos.`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const url = `${config.apiUrl}/qr/validate/${qrCode}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 429) {
            throw new Error('Muitas requisições. Tente novamente mais tarde.');
          }
          
          throw new Error('Produto não encontrado');
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar validação');
      } finally {
        setLoading(false);
      }
    };

    fetchValidation();
  }, [qrCode, checkLimit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando validação...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isBlocked ? 'Limite de tentativas excedido' : 'Produto não encontrado'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'O QR code escaneado não corresponde a nenhum produto válido.'}
          </p>
          {isBlocked && timeUntilReset > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Aguarde {timeUntilReset} segundos antes de tentar novamente.
            </p>
          )}
          <Link
            to="/"
            className="btn-primary"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { product, validation, isValidated } = data;

  // Check if product has SmartLabel enabled
  useEffect(() => {
    if (product && product.enableSmartLabel && product.smartLabelUrl) {
      // Redirect to SmartLabel page
      navigate(`/smart-label/${product.id}`);
    }
  }, [product, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Product Image */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <span className="text-xl font-semibold">True Label</span>
            </div>
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              Conhecer a plataforma
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg shadow-lg bg-white"
              />
            )}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl opacity-90 mb-1">{product.brand}</p>
              <p className="text-sm opacity-80">{product.category}</p>
              {product.description && (
                <p className="mt-4 text-white/90 max-w-2xl">{product.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Validation Status */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
          <div className={`p-6 ${isValidated ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center space-x-3">
              {isValidated ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <Clock className="h-10 w-10 text-yellow-600" />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isValidated ? 'Produto Validado' : 'Validação Pendente'}
                </h2>
                <p className="text-gray-700 mt-1">
                  {isValidated
                    ? `Validado por ${validation?.laboratory.name} em ${validation?.validatedAt ? formatDateTime(validation.validatedAt) : ''}`
                    : 'Este produto ainda não foi validado por laboratório acreditado'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Product Information Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button className="px-6 py-3 border-b-2 border-primary-600 text-primary-600 font-medium">
                Validação
              </button>
              <button className="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                Informações
              </button>
              <button className="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                Laboratório
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {/* Validation Details */}
            {validation ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status da Validação</h4>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(validation.status)}`}>
                      {getStatusText(validation.status)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Data da Validação</h4>
                    <p className="text-gray-900">
                      {validation.validatedAt ? formatDateTime(validation.validatedAt) : 'Pendente'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Validade</h4>
                    <p className="text-gray-900">
                      {validation.validatedAt 
                        ? `Válido por 12 meses`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {validation.summary && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo da Validação</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">{validation.summary}</p>
                    </div>
                  </div>
                )}

                {/* Laboratory Information */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Laboratório Responsável</h4>
                  <div className="flex items-start space-x-4">
                    <Building className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{validation.laboratory.name}</p>
                      <p className="text-sm text-gray-600">{validation.laboratory.accreditation}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Laboratório Acreditado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Este produto ainda não foi validado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Entre em contato com a marca para mais informações
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Claims */}
        {(() => {
          const claimsArray = getClaimsArray(product.claims);
          return claimsArray.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Claims do Produto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {claimsArray.map((claim, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {validation?.claimsValidated?.[claim] ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{claim}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Nutritional Info */}
        {product.nutritionalInfo && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Nutricionais
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(product.nutritionalInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators & Security */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Segurança & Confiança
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Plataforma Verificada</p>
                  <p className="text-xs text-gray-500">True Label Platform</p>
                </div>
              </div>

              {validation && (
                <div className="flex items-start space-x-3">
                  <Building className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lab Acreditado</p>
                    <p className="text-xs text-gray-500">{validation.laboratory.accreditation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Última Atualização</p>
                  <p className="text-xs text-gray-500">{formatDateTime(data.lastUpdated)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <QrCode className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">QR Code Único</p>
                  <p className="text-xs text-gray-500">{qrCode}</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Este QR code é único e rastreável. Cada escaneamento é registrado para garantir a autenticidade do produto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>
              Validação fornecida pela{' '}
              <Link to="/" className="text-primary-600 hover:text-primary-500">
                CPG Validation Platform
              </Link>
            </span>
          </div>
          <div className="mt-4">
            <Link
              to="/"
              className="btn-outline"
            >
              Conhecer a Plataforma
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPublicPage;
