import React from 'react';
import { QrCode, Download, Copy, ExternalLink } from 'lucide-react';
import { useQRCode } from '@/hooks/useQRCode';

interface QRCodeGeneratorProps {
  productId: string;
  productName: string;
  onClose?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  productId,
  productName,
  onClose
}) => {
  const {
    qrData,
    isGenerating,
    hasQRCode,
    generateQRCode,
    copyToClipboard,
    downloadQRCode,
    openValidationPage
  } = useQRCode(productId);



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">QR Code do Produto</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{productName}</h3>
          <p className="text-sm text-gray-600">ID: {productId}</p>
        </div>

        {!hasQRCode ? (
          /* Generate QR Code */
          <div className="text-center">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Gere um QR Code para permitir que consumidores validem este produto
            </p>
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  <span>Gerar QR Code</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Display QR Code */
          <div className="space-y-6">
            {/* QR Code Image */}
            <div className="text-center">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={qrData?.qrCodeImage}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Código: {qrData?.qrCode}
              </p>
              <p className="mt-1 text-xs text-green-600">
                ✓ QR Code salvo e disponível offline
              </p>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Validação
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={qrData?.validationUrl || ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(qrData?.validationUrl || '', 'URL')}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Download className="h-4 w-4" />
                <span>Baixar</span>
              </button>

              <button
                onClick={openValidationPage}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Testar</span>
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Imprima o QR Code na embalagem do produto</li>
                <li>• Consumidores podem escanear para validar claims</li>
                <li>• O código leva à página de validação pública</li>
              </ul>
            </div>

            {/* Permanence Warning */}
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
                    Este QR Code será impresso nas embalagens e deve permanecer válido permanentemente. Não é possível regenerar após a criação.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
