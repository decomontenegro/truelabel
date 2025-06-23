import React, { useEffect } from 'react';
import { X, Download, Copy, ExternalLink, QrCode } from 'lucide-react';
import { useQRStore } from '@/stores/qrStore';
import { useAuthStore } from '@/stores/authStore';
import { productService } from '@/services/productService';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

const GlobalQRModal: React.FC = () => {
  const { token } = useAuthStore();
  const {
    isModalOpen,
    selectedProductId,
    selectedProductName,
    currentQRData,
    isGenerating,
    setCurrentQRData,
    setIsGenerating,
    addQRCode,
    getQRCode,
    closeModal
  } = useQRStore();

  // Verificar se já existe QR Code quando o modal abre
  useEffect(() => {
    if (isModalOpen && selectedProductId) {
      checkExistingQRCode();
    }
  }, [isModalOpen, selectedProductId]);

  const checkExistingQRCode = async () => {
    if (!selectedProductId) {
      return;
    }

    try {
      // Sempre buscar dados atualizados do backend para garantir sincronização
      const productResponse = await productService.getProduct(selectedProductId);
      const product = productResponse.product;

      if (product.qrCode) {
        // Produto tem QR Code no banco
        const validationUrl = `${window.location.origin}/validation/${product.qrCode}`;
        
        // Tentar buscar a imagem do QR code do backend primeiro
        let qrCodeImage: string;
        try {
          // Tentar gerar QR code no backend
          const qrResponse = await api.post('/qr/generate', {
            productId: selectedProductId
          });
          qrCodeImage = qrResponse.data.qrCodeImage;
        } catch (error) {
          // Fallback para geração de imagem local se o backend falhar
          qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(validationUrl)}`;
        }

        const qrCodeData = {
          qrCode: product.qrCode,
          validationUrl: validationUrl,
          qrCodeImage: qrCodeImage,
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            sku: product.sku
          }
        };

        // Atualizar cache com dados mais recentes
        addQRCode(selectedProductId, qrCodeData);
        setCurrentQRData(qrCodeData);
      } else {
        // Limpar cache se o produto não tem QR code
        setCurrentQRData(null);
      }
    } catch (error) {
      console.error('Erro ao verificar QR code existente:', error);
      setCurrentQRData(null);
    }
  };

  const generateQRCode = async () => {
    if (!selectedProductId) {
      toast.error('ID do produto não encontrado.');
      return;
    }

    setIsGenerating(true);
    try {

      // Usar a instância do axios que já tem o interceptor configurado
      const response = await api.post('/qr/generate', {
        productId: selectedProductId
      });


      addQRCode(selectedProductId, response.data);
      toast.success('QR Code gerado com sucesso!');
    } catch (error) {
      // O interceptor do axios já trata os erros e mostra o toast
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado para a área de transferência!`);
    } catch (error) {
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const downloadQRCode = () => {
    if (!currentQRData) return;

    const link = document.createElement('a');
    link.href = currentQRData.qrCodeImage;
    link.download = `qr-code-${currentQRData.product.sku || currentQRData.qrCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('QR Code baixado com sucesso!');
  };

  const openValidationPage = () => {
    if (!currentQRData) return;
    window.open(currentQRData.validationUrl, '_blank');
  };

  if (!isModalOpen) {
    return null;
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <QrCode className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              QR Code - {selectedProductName}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!currentQRData ? (
            <div className="text-center">
              <div className="mb-6">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Gerar QR Code
                </h3>
                <p className="text-gray-600">
                  Clique no botão abaixo para gerar um QR Code único para este produto.
                </p>
              </div>

              <button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gerando QR Code...</span>
                  </div>
                ) : (
                  'Gerar QR Code'
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              {/* QR Code Image */}
              <div className="mb-6">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={currentQRData.qrCodeImage}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                    onLoad={() => {}}
                    onError={(e) => {
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Código: {currentQRData.qrCode}
                </p>
                <p className="mt-1 text-xs text-green-600">
                  ✓ QR Code salvo e disponível offline
                </p>
              </div>

              {/* URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Validação
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={currentQRData.validationUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(currentQRData.validationUrl, 'URL')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar</span>
                </button>

                <button
                  onClick={() => copyToClipboard(currentQRData.validationUrl, 'URL')}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar</span>
                </button>

                <button
                  onClick={openValidationPage}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Abrir</span>
                </button>
              </div>

              {/* Warning about QR Code permanence */}
              <div className="mt-4 pt-4 border-t">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        QR Code Permanente
                      </h3>
                      <div className="mt-1 text-xs text-amber-700">
                        Este QR Code será impresso nas embalagens e deve permanecer válido permanentemente.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalQRModal;
