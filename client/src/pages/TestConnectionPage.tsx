import React, { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { productService } from '@/services/productService';
import api from '@/services/api';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export const TestConnectionPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check', status: 'pending', message: 'Aguardando...' },
    { name: 'Login Admin', status: 'pending', message: 'Aguardando...' },
    { name: 'Listar Produtos', status: 'pending', message: 'Aguardando...' },
    { name: 'Criar Produto', status: 'pending', message: 'Aguardando...' },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, status: TestResult['status'], message: string, data?: any) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, data } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      // Test 1: Health Check
      updateTest(0, 'pending', 'Testando conexão...');
      try {
        const healthResponse = await api.get('/health');
        updateTest(0, 'success', 'Conexão estabelecida', healthResponse.data);
      } catch (error: any) {
        updateTest(0, 'error', `Erro: ${error.message}`);
        setIsRunning(false);
        return;
      }

      // Test 2: Login
      updateTest(1, 'pending', 'Fazendo login...');
      try {
        const loginResponse = await authService.login({
          email: 'admin@truelabel.com',
          password: 'admin123'
        });
        updateTest(1, 'success', `Login realizado: ${loginResponse.user.name}`, loginResponse);
      } catch (error: any) {
        updateTest(1, 'error', `Erro no login: ${error.response?.data?.error || error.message}`);
        setIsRunning(false);
        return;
      }

      // Test 3: Listar Produtos
      updateTest(2, 'pending', 'Listando produtos...');
      try {
        const productsResponse = await productService.getProducts();
        updateTest(2, 'success', `${productsResponse.data.length} produtos encontrados`, productsResponse);
      } catch (error: any) {
        updateTest(2, 'error', `Erro ao listar produtos: ${error.response?.data?.error || error.message}`);
      }

      // Test 4: Criar Produto
      updateTest(3, 'pending', 'Criando produto de teste...');
      try {
        const newProduct = {
          name: `Produto Teste ${Date.now()}`,
          brand: 'Marca Teste',
          category: 'Teste',
          sku: `TEST${Date.now()}`,
          claims: 'Teste,Funcional'
        };
        
        const createResponse = await productService.createProduct(newProduct);
        updateTest(3, 'success', `Produto criado: ${createResponse.product.name}`, createResponse);
      } catch (error: any) {
        updateTest(3, 'error', `Erro ao criar produto: ${error.response?.data?.error || error.message}`);
      }

    } catch (error: any) {
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧪 Teste de Conexão Frontend ↔ Backend
            </h1>
            <p className="text-gray-600">
              Verificando se o frontend React consegue se comunicar com o backend Node.js
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isRunning ? '🔄 Executando Testes...' : '🚀 Executar Testes'}
            </button>
          </div>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {getStatusIcon(test.status)} {test.name}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>
                
                <p className={`text-sm ${getStatusColor(test.status)}`}>
                  {test.message}
                </p>
                
                {test.data && test.status === 'success' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      Ver dados da resposta
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informações do Sistema</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Frontend:</strong> React + TypeScript (http://localhost:3000)</p>
              <p><strong>Backend:</strong> Node.js + Express (http://localhost:3001)</p>
              <p><strong>Banco:</strong> SQLite com Prisma ORM</p>
              <p><strong>Autenticação:</strong> JWT</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Voltar para Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnectionPage;
