import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Shield } from 'lucide-react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import ProductSealsManager from '@/components/seals/ProductSealsManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Helper function to convert claims string to array
const getClaimsArray = (claims: string | string[] | null | undefined): string[] => {
  if (!claims) return [];
  if (Array.isArray(claims)) return claims;
  if (typeof claims === 'string') {
    return claims.split(',').map(claim => claim.trim()).filter(claim => claim.length > 0);
  }
  return [];
};

const ProductSealsPage: React.FC = () => {
  console.log('🔍 ProductSealsPage: Componente renderizado');

  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('📦 ProductSealsPage: productId extraído da URL:', productId);

  useEffect(() => {
    console.log('🔍 ProductSealsPage: useEffect executado', { productId });
    if (productId) {
      console.log('📦 ProductSealsPage: Carregando produto', productId);
      loadProduct();
    } else {
      console.error('❌ ProductSealsPage: productId não encontrado');
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) {
      console.error('❌ ProductSealsPage: loadProduct chamado sem productId');
      return;
    }

    try {
      console.log('📦 ProductSealsPage: Iniciando carregamento do produto', productId);
      setLoading(true);
      const response = await productService.getProduct(productId);
      console.log('✅ ProductSealsPage: Produto carregado com sucesso', response);
      setProduct(response.product);
    } catch (error: any) {
      console.error('❌ ProductSealsPage: Erro ao carregar produto', error);
      toast.error(`Erro ao carregar produto: ${error.message || 'Erro desconhecido'}`);
      navigate('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Produto não encontrado
        </h3>
        <p className="text-gray-600 mb-4">
          O produto solicitado não foi encontrado.
        </p>
        <button
          onClick={() => navigate('/dashboard/products')}
          className="btn btn-primary"
        >
          Voltar para Produtos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Selos e Certificações
              </h1>
              <p className="text-gray-600">
                {product.name} - {product.brand}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {product.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Marca:</span>
                <span className="ml-2 font-medium text-gray-900">{product.brand}</span>
              </div>
              <div>
                <span className="text-gray-600">Categoria:</span>
                <span className="ml-2 font-medium text-gray-900">{product.category}</span>
              </div>
              <div>
                <span className="text-gray-600">SKU:</span>
                <span className="ml-2 font-mono text-gray-900">{product.sku}</span>
              </div>
            </div>
            {product.description && (
              <p className="mt-3 text-gray-600">{product.description}</p>
            )}
            {(() => {
              const claimsArray = getClaimsArray(product.claims);
              return claimsArray.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-600">Claims:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {claimsArray.map((claim, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {claim}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Seals Manager */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProductSealsManager
          product={product}
          onUpdate={loadProduct}
        />
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Sobre Selos e Certificações
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>Selos Obrigatórios:</strong> São exigidos por lei para comercialização
                do produto (ex: ANVISA, SIF).
              </p>
              <p>
                <strong>Selos de Qualidade:</strong> Certificam processos e padrões de qualidade
                (ex: ISO 22000, HACCP).
              </p>
              <p>
                <strong>Selos Orgânicos:</strong> Validam produção orgânica e natural
                (ex: Orgânico Brasil, IBD).
              </p>
              <p>
                <strong>Selos Éticos:</strong> Garantem práticas éticas e responsáveis
                (ex: Vegano, Fair Trade).
              </p>
              <p>
                <strong>Selos Ambientais:</strong> Certificam sustentabilidade e responsabilidade
                ambiental (ex: Eureciclo, Carbono Neutro).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSealsPage;
