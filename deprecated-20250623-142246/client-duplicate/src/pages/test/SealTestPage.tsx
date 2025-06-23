import React, { useState, useEffect } from 'react';
import { sealService } from '@/services/sealService';
import toast from 'react-hot-toast';

const SealTestPage: React.FC = () => {
  const [seals, setSeals] = useState<any[]>([]);
  const [productSeals, setProductSeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const productId = '04aa9c1a-c7c2-48a9-84ce-560e50914dfe';

  const testGetSeals = async () => {
    try {
      setLoading(true);

      const response = await sealService.getSeals({ isActive: true });

      setSeals(response.seals || []);
      toast.success(`Carregados ${response.seals?.length || 0} selos`);

    } catch (error) {
      toast.error('Erro ao carregar selos');
    } finally {
      setLoading(false);
    }
  };

  const testGetProductSeals = async () => {
    try {
      setLoading(true);

      const response = await sealService.getProductSeals({ productId });

      setProductSeals(response.productSeals || []);
      toast.success(`Carregados ${response.productSeals?.length || 0} selos do produto`);

    } catch (error) {
      toast.error('Erro ao carregar selos do produto');
    } finally {
      setLoading(false);
    }
  };

  const testAddSeal = async () => {
    try {
      setLoading(true);

      const sealData = {
        productId,
        sealId: 'sif',
        certificateNumber: 'TEST123',
        issuedDate: '2024-01-01',
        expiryDate: '2025-01-01',
        validatingLaboratory: 'Laboratório Teste',
        notes: 'Teste de adição de selo'
      };


      const response = await sealService.addProductSeal(sealData);

      toast.success('Selo adicionado com sucesso!');

      // Recarregar selos do produto
      await testGetProductSeals();

    } catch (error) {
      toast.error('Erro ao adicionar selo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testGetSeals();
    testGetProductSeals();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🧪 Teste de Selos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selos Disponíveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Selos Disponíveis ({seals.length})</h2>
            <button
              onClick={testGetSeals}
              disabled={loading}
              className="btn btn-outline btn-sm"
            >
              🔄 Recarregar
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {seals.map((seal) => (
              <div key={seal.id} className="p-2 border rounded">
                <div className="font-medium">{seal.name}</div>
                <div className="text-sm text-gray-600">{seal.purpose}</div>
                <div className="text-xs text-gray-400">
                  {seal.category} • {seal.isRequired ? 'Obrigatório' : 'Opcional'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selos do Produto */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Selos do Produto ({productSeals.length})</h2>
            <div className="flex space-x-2">
              <button
                onClick={testGetProductSeals}
                disabled={loading}
                className="btn btn-outline btn-sm"
              >
                🔄 Recarregar
              </button>
              <button
                onClick={testAddSeal}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                ➕ Adicionar SIF
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {productSeals.map((productSeal) => (
              <div key={productSeal.id} className="p-2 border rounded">
                <div className="font-medium">{productSeal.seal?.name || productSeal.sealId}</div>
                <div className="text-sm text-gray-600">
                  Certificado: {productSeal.certificateNumber || 'N/A'}
                </div>
                <div className="text-xs text-gray-400">
                  Status: {productSeal.status} •
                  Criado: {new Date(productSeal.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Instruções:</h3>
        <ul className="text-sm space-y-1">
          <li>1. Verifique se os selos disponíveis são carregados</li>
          <li>2. Verifique se os selos do produto são carregados</li>
          <li>3. Teste adicionar um selo SIF</li>
          <li>4. Abra o console do navegador para ver os logs detalhados</li>
        </ul>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <div className="mt-2 text-sm">Carregando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SealTestPage;
