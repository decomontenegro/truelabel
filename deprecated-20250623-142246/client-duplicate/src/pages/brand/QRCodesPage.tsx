import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Download, Share2, Copy, Eye, BarChart3, Package } from 'lucide-react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import { qrService } from '@/services/qrService';
import { useQRStore } from '@/stores/qrStore';
import { toast } from 'react-hot-toast';

interface ProductWithQR extends Product {
  qrCodeData?: {
    qrCode: string;
    validationUrl: string;
    qrCodeImage: string;
  };
  hasQRCode?: boolean;
}

export const QRCodesPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const { qrCodes, getQRCode, lastUpdate } = useQRStore();

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts({ limit: 100 });

      // Verificar quais produtos têm QR Code (banco + cache)
      const productsWithQRStatus = response.data.map((product) => {
        // 1. Verificar se tem QR Code no banco
        const hasQRInDB = !!product.qrCode;

        // 2. Verificar se tem QR Code no cache local
        const cachedQR = getQRCode(product.id);

        // 3. Usar dados do cache se disponível, senão do banco
        let qrCodeData = null;
        if (cachedQR) {
          qrCodeData = cachedQR;
        } else if (hasQRInDB) {
          // Criar dados do QR Code baseado no banco
          const validationUrl = `${window.location.origin}/validation/${product.qrCode}`;
          qrCodeData = {
            qrCode: product.qrCode,
            validationUrl: validationUrl,
            qrCodeImage: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`,
            product: {
              id: product.id,
              name: product.name,
              brand: product.brand,
              sku: product.sku
            }
          };
        }

        return {
          ...product,
          hasQRCode: hasQRInDB || !!cachedQR,
          qrCodeData
        };
      });

      setProducts(productsWithQRStatus);
    } catch (error: any) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Recarregar quando o cache de QR Codes mudar
  useEffect(() => {
    if (products.length > 0) {
      loadProducts();
    }
  }, [lastUpdate]);

  // Gerar QR Code
  const generateQRCode = async (productId: string) => {
    try {
      setGeneratingQR(productId);
      const qrCodeData = await qrService.generateQRCode(productId);

      // Atualizar produto com dados do QR Code
      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, qrCodeData, hasQRCode: true }
          : product
      ));

      toast.success('QR Code gerado com sucesso!');
    } catch (error: any) {

      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('Produto não encontrado ou não validado.');
      } else if (error.response?.status === 403) {
        toast.error('Você não tem permissão para gerar QR Code para este produto.');
      } else {
        toast.error('Erro ao gerar QR Code. Tente novamente.');
      }
    } finally {
      setGeneratingQR(null);
    }
  };

  // Download do QR Code
  const downloadQRCode = (product: ProductWithQR) => {
    if (product.qrCodeData) {
      qrService.downloadQRCodeImage(product.qrCodeData.qrCodeImage, product.name);
      toast.success('Download iniciado');
    }
  };

  // Copiar URL de validação
  const copyValidationUrl = async (product: ProductWithQR) => {
    if (product.qrCodeData) {
      const success = await qrService.copyValidationUrl(product.qrCodeData.validationUrl);
      if (success) {
        toast.success('URL copiada para a área de transferência');
      } else {
        toast.error('Erro ao copiar URL');
      }
    }
  };

  // Compartilhar QR Code
  const shareQRCode = async (product: ProductWithQR) => {
    if (product.qrCodeData) {
      const success = await qrService.shareQRCode(product.qrCodeData);
      if (!success) {
        // Fallback: copiar URL
        await copyValidationUrl(product);
      }
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-gray-600">Gerencie QR Codes dos seus produtos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <QrCode className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Com QR Code</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.hasQRCode).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Validados</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.status === 'VALIDATED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border p-6">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.brand}</p>
                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                {product.status === 'VALIDATED' && 'Validado'}
                {product.status === 'PENDING' && 'Pendente'}
                {product.status === 'REJECTED' && 'Rejeitado'}
              </span>
            </div>

            {/* QR Code Section */}
            {product.hasQRCode && product.qrCodeData ? (
              <div className="space-y-4">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <img
                    src={product.qrCodeData.qrCodeImage}
                    alt={`QR Code - ${product.name}`}
                    className="w-32 h-32 border rounded-lg"
                  />
                </div>

                {/* URL de Validação */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">URL de Validação:</p>
                  <p className="text-xs font-mono text-gray-800 break-all">
                    {product.qrCodeData.validationUrl}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadQRCode(product)}
                    className="flex-1 btn btn-outline text-sm"
                    title="Download QR Code"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => copyValidationUrl(product)}
                    className="flex-1 btn btn-outline text-sm"
                    title="Copiar URL"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </button>
                  <button
                    onClick={() => shareQRCode(product)}
                    className="btn btn-outline text-sm px-3"
                    title="Compartilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  {product.status === 'VALIDATED'
                    ? 'QR Code não gerado'
                    : 'Produto precisa ser validado primeiro'
                  }
                </p>
                {product.status === 'VALIDATED' && (
                  <button
                    onClick={() => generateQRCode(product.id)}
                    disabled={generatingQR === product.id}
                    className="btn btn-primary text-sm"
                  >
                    {generatingQR === product.id ? (
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
                )}
              </div>
            )}

            {/* Analytics Link */}
            {product.hasQRCode && (
              <div className="mt-4 pt-4 border-t">
                <button
                  className="w-full btn btn-outline text-sm"
                  onClick={() => navigate(`/dashboard/qr-codes/${product.id}/analytics`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Analytics
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estado vazio */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Cadastre produtos para gerar QR Codes
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodesPage;
