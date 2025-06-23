import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, QrCode, FileText, Building, User, Calendar, Tag, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { productService } from '@/services/productService';
import { qrService } from '@/services/qrService';
import { validationService } from '@/services/validationService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ValidationLifecycleTimeline, QRStatusManager, ExpirationWarningBadge, RevalidationRequestForm } from '@/components/lifecycle';
import { addDays, isPast } from 'date-fns';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  description: string;
  claims: string;
  nutritionalInfo: any;
  imageUrl?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  validations?: Array<{
    id: string;
    status: 'APPROVED' | 'REJECTED';
    type?: 'MANUAL' | 'LABORATORY';
    claimsValidated: any;
    observations: string;
    validatedAt: string;
    expiryDate?: string;
    validator?: {
      name: string;
      email: string;
    };
    laboratory?: {
      name: string;
      accreditation: string;
    };
  }>;
  qrCodes?: Array<{
    id: string;
    code: string;
    isActive: boolean;
    accessCount: number;
    createdAt: string;
    status?: 'active' | 'expired' | 'suspended';
    expiryDate?: string;
    lastScanned?: string;
    scanCount?: number;
  }>;
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showRevalidationForm, setShowRevalidationForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'lifecycle' | 'qr'>('details');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id!);
      setProduct(response);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Produto não encontrado');
        navigate('/dashboard/products');
      } else {
        toast.error('Erro ao carregar produto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!product || product.status !== 'VALIDATED') {
      toast.error('Apenas produtos validados podem gerar QR Codes');
      return;
    }

    try {
      setGeneratingQR(true);
      await qrService.generateQRCode(product.id);
      toast.success('QR Code gerado com sucesso!');
      fetchProduct(); // Recarregar para mostrar o novo QR Code
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendente' },
      VALIDATED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Validado' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejeitado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produto não encontrado</h2>
          <p className="text-gray-600 mb-4">O produto solicitado não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="btn btn-primary"
          >
            Voltar para Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/products')}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.brand} • {product.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(product.status)}
          {product.validations && product.validations.length > 0 && 
           product.validations[0].expiryDate && (
            <ExpirationWarningBadge 
              expiryDate={new Date(product.validations[0].expiryDate)}
              type="validation"
              size="md"
            />
          )}
          {product.status === 'VALIDATED' && (
            <>
              <button
                onClick={handleGenerateQR}
                disabled={generatingQR}
                className="btn btn-primary flex items-center"
              >
                {generatingQR ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRevalidationForm(true)}
                className="btn btn-outline flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Solicitar Revalidação
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Detalhes do Produto
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lifecycle' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Ciclo de Vida
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'qr' 
                ? 'text-indigo-600 border-indigo-600' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Gerenciar QR Codes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <p className="text-gray-900 font-mono">{product.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <p className="text-gray-900">{product.category}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-gray-900">{product.description || 'Não informado'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Claims</label>
                <p className="text-gray-900">{product.claims || 'Nenhum claim informado'}</p>
              </div>
            </div>
          </div>

          {/* Nutritional Information */}
          {product.nutritionalInfo && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informações Nutricionais
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(product.nutritionalInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Validations */}
          {product.validations && product.validations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Histórico de Validações
              </h2>
              <div className="space-y-4">
                {product.validations.map((validation) => (
                  <div key={validation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        validation.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validation.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(validation.validatedAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Validador:</span>
                        <p className="text-gray-900">{validation.validator?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo:</span>
                        <p className="text-gray-900">{validation.type || 'Manual'}</p>
                      </div>
                    </div>
                    {validation.observations && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Observações:</span>
                        <p className="text-gray-900 mt-1">{validation.observations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagem do Produto</h3>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          {/* QR Codes */}
          {product.qrCodes && product.qrCodes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                QR Codes
              </h3>
              <div className="space-y-3">
                {product.qrCodes.map((qr) => (
                  <div key={qr.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-900">{qr.code}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        qr.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {qr.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Acessos: {qr.accessCount}</p>
                      <p>Criado: {formatDate(qr.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Informações do Sistema
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Criado em:</span>
                <p className="text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Última atualização:</span>
                <p className="text-gray-900">{formatDate(product.updatedAt)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID do produto:</span>
                <p className="text-gray-900 font-mono text-xs break-all">{product.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Lifecycle Tab */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          {product.validations && product.validations.length > 0 && (
            <ValidationLifecycleTimeline
              events={product.validations.map((val, index) => ({
                id: val.id,
                type: val.status === 'APPROVED' ? 'validated' : 'expired',
                date: new Date(val.validatedAt),
                title: val.status === 'APPROVED' ? 'Validação Aprovada' : 'Validação Rejeitada',
                description: val.observations || 'Sem observações',
                actor: val.validator?.name || val.laboratory?.name || 'Sistema',
                metadata: {
                  'Tipo': val.type || 'Manual',
                  'Laboratório': val.laboratory?.name || 'N/A'
                }
              }))}
              currentStatus={
                product.validations[0]?.expiryDate && isPast(new Date(product.validations[0].expiryDate))
                  ? 'expired'
                  : product.status === 'VALIDATED' ? 'active' : 'suspended'
              }
              expiryDate={product.validations[0]?.expiryDate ? new Date(product.validations[0].expiryDate) : undefined}
              nextRevalidationDate={
                product.validations[0]?.expiryDate 
                  ? addDays(new Date(product.validations[0].expiryDate), -30)
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* QR Management Tab */}
      {activeTab === 'qr' && product.qrCodes && (
        <QRStatusManager
          qrCodes={product.qrCodes.map(qr => ({
            id: qr.id,
            code: qr.code,
            productSku: product.sku,
            productName: product.name,
            status: qr.status || (qr.isActive ? 'active' : 'suspended'),
            createdAt: new Date(qr.createdAt),
            expiryDate: qr.expiryDate ? new Date(qr.expiryDate) : undefined,
            lastScanned: qr.lastScanned ? new Date(qr.lastScanned) : undefined,
            scanCount: qr.scanCount || qr.accessCount || 0
          }))}
          onStatusChange={fetchProduct}
          onRegenerate={async (qrId) => {
            await handleGenerateQR();
          }}
        />
      )}

      {/* Revalidation Form Modal */}
      {showRevalidationForm && product.validations && product.validations.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Solicitar Revalidação</h2>
              <RevalidationRequestForm
                productId={product.id}
                productName={product.name}
                currentValidationId={product.validations[0].id}
                expiryDate={product.validations[0].expiryDate ? new Date(product.validations[0].expiryDate) : new Date()}
                onSuccess={() => {
                  setShowRevalidationForm(false);
                  fetchProduct();
                  toast.success('Solicitação de revalidação enviada com sucesso');
                }}
                onCancel={() => setShowRevalidationForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;