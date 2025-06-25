import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, User, Shield, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Validation, Product } from '@/types';
import { validationService } from '@/services/validationService';
import { productService } from '@/services/productService';
import { certificationService } from '@/services/certificationService';
import { toast } from 'react-hot-toast';

const ValidationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [validation, setValidation] = useState<Validation | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productCertifications, setProductCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [claimsValidation, setClaimsValidation] = useState<Record<string, 'APPROVED' | 'REJECTED' | 'PENDING'>>({});

  useEffect(() => {
    if (id) {
      loadValidation();
    }
  }, [id]);

  const loadValidation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await validationService.getValidation(id);
      setValidation(response.validation);

      // Load product details if productId exists
      if (response.validation?.productId) {
        try {
          const productResponse = await productService.getProduct(response.validation.productId);
          setProduct(productResponse.product);

          // Initialize claims validation state
          if (productResponse.product?.claims) {
            const claims = typeof productResponse.product.claims === 'string'
              ? productResponse.product.claims.split(',').map(c => c.trim())
              : Object.keys(productResponse.product.claims);

            const initialClaimsState: Record<string, 'APPROVED' | 'REJECTED' | 'PENDING'> = {};
            claims.forEach(claim => {
              initialClaimsState[claim] = response.validation?.claimsValidated?.[claim] ? 'APPROVED' : 'PENDING';
            });
            setClaimsValidation(initialClaimsState);
          }

          // Load product certifications
          try {
            const certifications = await certificationService.getProductCertifications(response.validation.productId);
            setProductCertifications(certifications);
          } catch (certError) {
            console.error('Erro ao carregar certificações:', certError);
          }
        } catch (productError) {
          console.error('Erro ao carregar produto:', productError);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar validação:', error);
      toast.error('Erro ao carregar validação');
      navigate('/dashboard/validations');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimValidation = (claim: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    setClaimsValidation(prev => ({
      ...prev,
      [claim]: status
    }));
  };

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!id || !validation) return;

    setUpdating(true);
    try {
      // Prepare claims validation data
      const claimsValidated: Record<string, any> = {};
      Object.entries(claimsValidation).forEach(([claim, status]) => {
        if (status === 'APPROVED') {
          claimsValidated[claim] = true;
        }
      });

      const response = await validationService.updateValidation(id, {
        status: newStatus,
        claimsValidated
      });
      setValidation(response.validation);
      toast.success(`Validação ${newStatus === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const getClaimsArray = (claims: any): string[] => {
    if (!claims) return [];
    if (typeof claims === 'string') {
      return claims.split(',').map(c => c.trim()).filter(c => c.length > 0);
    }
    if (typeof claims === 'object') {
      return Object.keys(claims);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando validação...</p>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Validação não encontrada</p>
        <button
          onClick={() => navigate('/dashboard/validations')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Validações
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard/validations')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revisar Validação</h1>
              <p className="text-gray-600 mt-1">
                {validation.product?.name || 'Produto'} - {validation.product?.brand || 'Marca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {validation.status !== 'APPROVED' && (
              <button
                onClick={() => handleStatusUpdate('APPROVED')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                disabled={updating}
              >
                <Check className="w-4 h-4 mr-1 inline" />
                Aprovar
              </button>
            )}
            {validation.status !== 'REJECTED' && (
              <button
                onClick={() => handleStatusUpdate('REJECTED')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                disabled={updating}
              >
                <X className="w-4 h-4 mr-1 inline" />
                Rejeitar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Validação</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Status Atual</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
              validation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              validation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              validation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {validation.status === 'APPROVED' ? 'Aprovado' :
               validation.status === 'REJECTED' ? 'Rejeitado' :
               validation.status === 'PENDING' ? 'Pendente' : validation.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tipo de Validação</p>
            <p className="text-gray-900 mt-1">{validation.type || 'MANUAL'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Data de Criação</p>
            <p className="text-gray-900 mt-1">
              {new Date(validation.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {validation.validatedAt && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                Validado em {new Date(validation.validatedAt).toLocaleDateString('pt-BR')} às {new Date(validation.validatedAt).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Produto</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nome do Produto</p>
            <p className="text-gray-900 font-medium">{validation.product?.name || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Marca</p>
            <p className="text-gray-900 font-medium">{validation.product?.brand || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">SKU</p>
            <p className="text-gray-900 font-medium">{validation.product?.sku || 'N/A'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Categoria</p>
            <p className="text-gray-900 font-medium">{validation.product?.category || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Product Claims Review */}
      {product && getClaimsArray(product.claims).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Claims do Produto para Validação
          </h3>

          <div className="space-y-3">
            {getClaimsArray(product.claims).map((claim, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{claim}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Status:
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                        claimsValidation[claim] === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        claimsValidation[claim] === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {claimsValidation[claim] === 'APPROVED' ? 'Aprovado' :
                         claimsValidation[claim] === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </p>
                  </div>

                  {validation.status === 'PENDING' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleClaimValidation(claim, 'APPROVED')}
                        className={`p-2 rounded-lg transition-colors ${
                          claimsValidation[claim] === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title="Aprovar claim"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleClaimValidation(claim, 'REJECTED')}
                        className={`p-2 rounded-lg transition-colors ${
                          claimsValidation[claim] === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Rejeitar claim"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Instruções para Validação:</p>
                <p className="mt-1">
                  Revise cada claim individualmente. Aprove apenas claims que possuem documentação
                  adequada e atendem aos padrões de qualidade. Claims rejeitados não aparecerão
                  na validação final do produto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Certifications */}
      {productCertifications.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Certificações do Produto
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productCertifications.map((cert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{cert.certification?.name || 'Certificação'}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Número: {cert.certificateNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Validade: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>

                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cert.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    cert.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status === 'ACTIVE' ? 'Ativa' :
                     cert.status === 'EXPIRED' ? 'Expirada' : cert.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Validação</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">ID da Validação</p>
            <p className="text-gray-900 font-mono text-sm">{validation.id}</p>
          </div>

          {validation.summary && (
            <div>
              <p className="text-sm text-gray-600">Resumo</p>
              <p className="text-gray-900">{validation.summary}</p>
            </div>
          )}

          {validation.notes && (
            <div>
              <p className="text-sm text-gray-600">Observações</p>
              <p className="text-gray-700">{validation.notes}</p>
            </div>
          )}

          {validation.laboratory && (
            <div>
              <p className="text-sm text-gray-600">Laboratório</p>
              <p className="text-gray-900">{validation.laboratory}</p>
            </div>
          )}

          {validation.validator && (
            <div>
              <p className="text-sm text-gray-600">Validador</p>
              <div className="flex items-center mt-1">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{validation.validator}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline da Validação</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Validação Criada</p>
              <p className="text-sm text-gray-600">
                {new Date(validation.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {validation.requestedAt && (
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Validação Solicitada</p>
                <p className="text-sm text-gray-600">
                  {new Date(validation.requestedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {validation.validatedAt && (
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Validação Concluída</p>
                <p className="text-sm text-gray-600">
                  {new Date(validation.validatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationReviewPage;