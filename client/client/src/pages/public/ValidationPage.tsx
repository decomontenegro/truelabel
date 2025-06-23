import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Calendar, 
  Building, 
  Award,
  FileText,
  ExternalLink,
  Star
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

interface ValidationData {
  success: boolean;
  data?: {
    product: {
      id: string;
      name: string;
      brand: string;
      category: string;
      description: string;
      claims: Record<string, any>;
      nutritionalInfo: Record<string, any>;
      imageUrl?: string;
      status: string;
    };
    brand: {
      name: string;
      companyName?: string;
      email: string;
    };
    validation: {
      id: string;
      status: string;
      claimsValidated: string[];
      summary: string;
      validatedAt: string;
      laboratory: {
        name: string;
        accreditation: string;
        website?: string;
      };
    } | null;
    reports: Array<{
      id: string;
      analysisType: string;
      isVerified: boolean;
      laboratory: {
        name: string;
        accreditation: string;
      };
      createdAt: string;
    }>;
    trustScore: number;
    validationCount: number;
    lastValidated: string | null;
  };
  error?: string;
  message?: string;
}

const ValidationPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [data, setData] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (qrCode) {
      fetchValidationData(qrCode);
    }
  }, [qrCode]);

  const fetchValidationData = async (code: string) => {
    try {
      const response = await fetch(`/public/validate/${code}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      setData({
        success: false,
        error: 'Erro ao conectar com o servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrustScoreText = (score: number) => {
    if (score >= 80) return 'Alta Confiabilidade';
    if (score >= 60) return 'Confiabilidade Moderada';
    return 'Baixa Confiabilidade';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando produto...</p>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto Não Encontrado</h1>
          <p className="text-gray-600 mb-6">
            {data?.message || 'Este código QR não corresponde a nenhum produto validado.'}
          </p>
          <Logo variant="default" size="md" className="mx-auto" />
        </div>
      </div>
    );
  }

  const { product, brand, validation, reports, trustScore, validationCount } = data.data!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Logo variant="default" size="md" />
            <div className="text-right">
              <p className="text-sm text-gray-600">Validação Transparente</p>
              <p className="text-xs text-gray-500">Powered by True Label</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-6">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{product.brand}</p>
              <p className="text-sm text-gray-500 mb-4">{product.category}</p>
              
              {/* Trust Score */}
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustScoreColor(trustScore)}`}>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span>{trustScore}/100 - {getTrustScoreText(trustScore)}</span>
                  </div>
                </div>
                
                {validation && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Validado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validation Status */}
            {validation ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Validação Aprovada</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Claims Validados</h3>
                    <div className="flex flex-wrap gap-2">
                      {validation.claimsValidated.map((claim, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {claim}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Resumo da Validação</h3>
                    <p className="text-gray-600">{validation.summary}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Validado em {new Date(validation.validatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{validation.laboratory.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-yellow-800">Validação Pendente</h2>
                </div>
                <p className="text-yellow-700">
                  Este produto ainda não possui validação aprovada. Os laudos estão sendo analisados.
                </p>
              </div>
            )}

            {/* Product Claims */}
            {product.claims && Object.keys(product.claims).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Claims do Produto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.claims).map(([key, value]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                      <p className="text-gray-600 mt-1">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutritional Info */}
            {product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Nutricionais</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-lg font-semibold text-gray-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Brand Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informações da Marca</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Marca</p>
                  <p className="font-medium text-gray-900">{brand.name}</p>
                </div>
                {brand.companyName && (
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-medium text-gray-900">{brand.companyName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Laboratory Info */}
            {validation && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Laboratório</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium text-gray-900">{validation.laboratory.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Acreditação</p>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-blue-600" />
                      <p className="font-medium text-gray-900">{validation.laboratory.accreditation}</p>
                    </div>
                  </div>
                  {validation.laboratory.website && (
                    <a
                      href={validation.laboratory.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">Visitar site</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Reports */}
            {reports.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Laudos Técnicos</h3>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{report.analysisType}</p>
                        {report.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{report.laboratory.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Validações</span>
                  <span className="font-medium">{validationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Laudos</span>
                  <span className="font-medium">{reports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score de Confiança</span>
                  <span className="font-medium">{trustScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPage;
