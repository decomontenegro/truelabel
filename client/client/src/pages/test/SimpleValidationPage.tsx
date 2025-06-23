import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const SimpleValidationPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [status, setStatus] = useState<string>('Carregando...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testAPI = async () => {
      if (!qrCode) {
        setStatus('❌ Nenhum QR Code fornecido');
        return;
      }

      try {
        setStatus('🔄 Fazendo chamada para API...');
        
        const response = await fetch(`http://localhost:3000/api/qr/validate/${qrCode}`);
        
        setStatus(`📡 Resposta recebida: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setStatus('✅ Dados carregados com sucesso!');
        } else {
          setStatus(`❌ Erro: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        setStatus(`❌ Erro de rede: ${error.message}`);
      }
    };

    testAPI();
  }, [qrCode]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste Simples de Validação</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>QR Code:</strong> {qrCode}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {data && (
        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
          <h3>📦 Produto:</h3>
          <p><strong>Nome:</strong> {data.product?.name}</p>
          <p><strong>Marca:</strong> {data.product?.brand}</p>
          <p><strong>Status:</strong> {data.product?.status}</p>
          
          <h3>🔬 Validação:</h3>
          <p><strong>É Validado:</strong> {data.isValidated ? '✅ Sim' : '❌ Não'}</p>
          <p><strong>Status:</strong> {data.validation?.status}</p>
          
          <details style={{ marginTop: '10px' }}>
            <summary>Ver JSON completo</summary>
            <pre style={{ backgroundColor: 'white', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Esta é uma página de teste simplificada para verificar se a API está funcionando.</p>
        <p>URL testada: http://localhost:3000/api/qr/validate/{qrCode}</p>
      </div>
    </div>
  );
};

export default SimpleValidationPage;
