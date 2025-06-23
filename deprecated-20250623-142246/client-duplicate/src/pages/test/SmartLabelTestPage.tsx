import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, QrCode, ArrowRight } from 'lucide-react';

export default function SmartLabelTestPage() {
  // Exemplos de códigos QR para teste
  const testCodes = [
    { code: 'TL-2024-ABCD1234', label: 'Produto com dados completos' },
    { code: 'TL-2024-TEST5678', label: 'Produto com certificações' },
    { code: 'TL-2024-DEMO9012', label: 'Produto com rastreabilidade' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Smartphone className="h-16 w-16 text-brand-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Smart Label - Página de Teste
            </h1>
            <p className="text-lg text-gray-600">
              Teste a nova experiência de validação de produtos
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Como funciona?
            </h2>
            <p className="text-blue-700 mb-4">
              A página Smart Label oferece uma experiência completa e interativa para consumidores
              que escaneiam QR codes dos produtos. Ela apresenta todas as informações do produto
              de forma organizada em abas navegáveis.
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Design mobile-first e responsivo</li>
              <li>Navegação por abas intuitiva</li>
              <li>Informações verificadas com badges de validação</li>
              <li>Dados de rastreabilidade e certificações</li>
              <li>Contato direto com o fabricante</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Códigos de Teste Disponíveis
            </h3>
            
            {testCodes.map((test) => (
              <div
                key={test.code}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <QrCode className="h-6 w-6 text-gray-400" />
                      <code className="text-lg font-mono text-gray-900">{test.code}</code>
                    </div>
                    <p className="text-gray-600">{test.label}</p>
                  </div>
                  <Link
                    to={`/smart-label/${test.code}`}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Testar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Funcionalidades da Smart Label
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Visão Geral</h4>
                <p className="text-sm text-gray-600">
                  Status de validação, informações básicas do produto e selos
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Ingredientes</h4>
                <p className="text-sm text-gray-600">
                  Lista completa de ingredientes e informações sobre alérgenos
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Nutrição</h4>
                <p className="text-sm text-gray-600">
                  Tabela nutricional completa com valores por porção
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Certificações</h4>
                <p className="text-sm text-gray-600">
                  Certificados e selos de qualidade com documentos verificáveis
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Rastreabilidade</h4>
                <p className="text-sm text-gray-600">
                  Cadeia completa desde a origem até a distribuição
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Contato</h4>
                <p className="text-sm text-gray-600">
                  Informações de contato do fabricante e atendimento
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/dashboard"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}