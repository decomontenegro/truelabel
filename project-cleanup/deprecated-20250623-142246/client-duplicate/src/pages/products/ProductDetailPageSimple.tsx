import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, QrCode, Edit, Smartphone, ExternalLink, ToggleLeft, ToggleRight, MapPin, Shield } from 'lucide-react';
import { productService } from '@/services/productService';
import { toast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  enableSmartLabel?: boolean;
  smartLabelUrl?: string;
  qrCode?: string;
}

const ProductDetailPageSimple = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingSmartLabel, setUpdatingSmartLabel] = useState(false);

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

  const handleSmartLabelToggle = async () => {
    if (!product) return;

    try {
      setUpdatingSmartLabel(true);
      const newValue = !product.enableSmartLabel;
      
      const response = await productService.updateSmartLabelPreference(product.id, newValue);
      
      setProduct({
        ...product,
        enableSmartLabel: newValue,
        smartLabelUrl: response.product.smartLabelUrl
      });
      
      toast.success(
        newValue 
          ? 'SmartLabel ativado! Os QR codes agora redirecionarão para a página SmartLabel.'
          : 'SmartLabel desativado. Os QR codes voltarão à página de validação padrão.'
      );
    } catch (error) {
      toast.error('Erro ao atualizar preferência SmartLabel');
    } finally {
      setUpdatingSmartLabel(false);
    }
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
          <button
            onClick={() => navigate(`/dashboard/products/${id}/edit`)}
            className="btn btn-secondary flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button
            onClick={() => navigate(`/dashboard/products/${id}/seals`)}
            className="btn btn-secondary flex items-center"
          >
            <Shield className="w-4 h-4 mr-2" />
            Selos
          </button>
          <button
            onClick={() => navigate(`/dashboard/products/${id}/traceability`)}
            className="btn btn-primary flex items-center"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Rastreabilidade
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Produto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Criado em</label>
            <p className="text-gray-900">{formatDate(product.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atualizado em</label>
            <p className="text-gray-900">{formatDate(product.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* SmartLabel Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Configurações SmartLabel
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Ativar SmartLabel</h3>
              <p className="text-sm text-gray-600 mt-1">
                Quando ativado, os QR codes redirecionarão para uma página SmartLabel aprimorada com informações detalhadas do produto.
              </p>
            </div>
            <button
              onClick={handleSmartLabelToggle}
              disabled={updatingSmartLabel}
              className="ml-4 relative inline-flex items-center cursor-pointer"
            >
              {updatingSmartLabel ? (
                <LoadingSpinner size="sm" />
              ) : product.enableSmartLabel ? (
                <ToggleRight className="w-12 h-12 text-primary-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>

          {product.enableSmartLabel && (
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExternalLink className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900 mb-2">
                    SmartLabel está ativo para este produto
                  </p>
                  {product.smartLabelUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-primary-700">URL SmartLabel:</p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-white px-2 py-1 rounded border border-primary-200 flex-1">
                          {window.location.origin}/smart-label/{product.id}
                        </code>
                        <button
                          onClick={() => window.open(`/smart-label/${product.id}`, '_blank')}
                          className="btn btn-sm btn-primary"
                        >
                          Visualizar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {product.qrCode && (
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">QR Code do Produto:</p>
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-gray-400" />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{product.qrCode}</code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nutritional Information */}
      {product.nutritionalInfo && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Nutricionais</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(product.nutritionalInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPageSimple;
