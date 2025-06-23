import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const ValidationTestPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testValidation = async () => {
    if (!qrCode) {
      setError('Nenhum QR Code fornecido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      
      const url = `http://localhost:3000/api/qr/validate/${qrCode}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      setData(result);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🧪 Teste de Validação</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Code da URL
          </label>
          <input
            type="text"
            value={qrCode || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>
        
        <button
          onClick={testValidation}
          disabled={loading || !qrCode}
          className="w-full btn btn-primary mb-4"
        >
          {loading ? '⏳ Testando...' : '🔄 Testar Validação'}
        </button>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-medium text-red-800">Erro:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {data && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800">✅ Validação Bem-sucedida</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Produto */}
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">📦 Produto</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {data.product?.name}</p>
                  <p><strong>Marca:</strong> {data.product?.brand}</p>
                  <p><strong>Categoria:</strong> {data.product?.category}</p>
                  <p><strong>Claims:</strong> {data.product?.claims}</p>
                  <p><strong>Status:</strong> {data.product?.status}</p>
                </div>
              </div>
              
              {/* Validação */}
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">🔬 Validação</h4>
                {data.validation ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>Status:</strong> {data.validation.status}</p>
                    <p><strong>Laboratório:</strong> {data.validation.laboratory?.name}</p>
                    <p><strong>Acreditação:</strong> {data.validation.laboratory?.accreditation}</p>
                    <p><strong>Resumo:</strong> {data.validation.summary}</p>
                    <p><strong>Validado em:</strong> {new Date(data.validation.validatedAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma validação encontrada</p>
                )}
              </div>
            </div>
            
            {/* Flags */}
            <div className="p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">🏷️ Flags</h4>
              <div className="space-y-1 text-sm">
                <p><strong>É Validado:</strong> {data.isValidated ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>Última Atualização:</strong> {new Date(data.lastUpdated).toLocaleString()}</p>
                <p><strong>Acessado em:</strong> {new Date(data.accessedAt).toLocaleString()}</p>
              </div>
            </div>
            
            {/* JSON Raw */}
            <details className="p-4 bg-gray-50 rounded-md">
              <summary className="font-medium text-gray-900 cursor-pointer">📋 Dados Raw (JSON)</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Instruções:</h3>
        <ul className="text-sm space-y-1">
          <li>• Esta página testa a validação de QR codes</li>
          <li>• O QR code vem da URL: /test-validation/:qrCode</li>
          <li>• Clique em "Testar Validação" para fazer a chamada da API</li>
          <li>• Verifique o console do navegador para logs detalhados</li>
          <li>• Se funcionar aqui, o problema pode estar na página principal</li>
        </ul>
      </div>
    </div>
  );
};

export default ValidationTestPage;
