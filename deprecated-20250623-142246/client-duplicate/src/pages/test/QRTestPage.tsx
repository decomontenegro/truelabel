import React, { useState } from 'react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

const QRTestPage: React.FC = () => {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [productId] = useState('04aa9c1a-c7c2-48a9-84ce-560e50914dfe');

  const testGenerateQR = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/qr/generate', { productId });
      
      setQrData(response.data);
      toast.success('QR Code gerado com sucesso!');
      
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    try {
      setLoading(true);
      
      // Fazer chamada direta sem interceptor
      const token = localStorage.getItem('auth-storage');
      const authData = token ? JSON.parse(token) : null;
      const authToken = authData?.state?.token;
      
      
      const response = await fetch('http://localhost:3000/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setQrData(data);
      toast.success('QR Code gerado via API direta!');
      
    } catch (error: any) {
      toast.error('Erro na API direta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🧪 Teste de QR Code</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controles */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Controles de Teste</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID
              </label>
              <input
                type="text"
                value={productId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={testGenerateQR}
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? '⏳ Gerando...' : '🔄 Gerar QR (Axios)'}
              </button>
              
              <button
                onClick={testDirectAPI}
                disabled={loading}
                className="w-full btn btn-outline"
              >
                {loading ? '⏳ Testando...' : '🔗 Testar API Direta (Fetch)'}
              </button>
              
              <button
                onClick={() => {
                  setQrData(null);
                  toast.success('Dados limpos');
                }}
                className="w-full btn btn-outline"
              >
                🗑️ Limpar Dados
              </button>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Resultado</h2>
          
          {!qrData ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📱</div>
              <p>Nenhum QR Code gerado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code Image */}
              <div className="text-center">
                <div className="inline-block p-4 bg-gray-50 border rounded-lg">
                  <img
                    src={qrData.qrCodeImage}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Código: {qrData.qrCode}
                </p>
              </div>
              
              {/* Dados */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    QR Code
                  </label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {qrData.qrCode}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    URL de Validação
                  </label>
                  <p className="text-sm bg-gray-50 p-2 rounded break-all">
                    {qrData.validationUrl}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Produto
                  </label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {qrData.product?.name} ({qrData.product?.brand})
                  </p>
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrData.validationUrl);
                    toast.success('URL copiada!');
                  }}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  📋 Copiar URL
                </button>
                
                <button
                  onClick={() => {
                    window.open(qrData.validationUrl, '_blank');
                  }}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  🔗 Abrir URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Debug Info:</h3>
        <ul className="text-sm space-y-1">
          <li>• Abra o console do navegador para ver logs detalhados</li>
          <li>• Teste primeiro com Axios (usa interceptor)</li>
          <li>• Teste depois com Fetch (API direta)</li>
          <li>• Verifique se a imagem do QR Code carrega</li>
          <li>• Teste a URL de validação</li>
        </ul>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <div className="mt-2 text-sm">Processando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRTestPage;
