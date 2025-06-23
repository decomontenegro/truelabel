import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowLeft } from 'lucide-react';

export default function AnalyticsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <BarChart3 className="h-16 w-16 text-brand-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics - Página de Teste
            </h1>
            <p className="text-lg text-gray-600">
              Teste e diagnóstico da funcionalidade de analytics
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Status da Implementação
              </h2>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                <li>✅ Componente AnalyticsDashboard criado</li>
                <li>✅ Serviço de Analytics configurado</li>
                <li>✅ Mock de dados implementado</li>
                <li>✅ Bibliotecas Recharts e date-fns instaladas</li>
                <li>✅ Rota /dashboard/analytics configurada</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                Observações Importantes
              </h2>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Backend tem apenas endpoints /analytics/dashboard e /analytics/product/:productId</li>
                <li>Frontend espera endpoints mais granulares que ainda não existem</li>
                <li>Usando dados mockados até sincronizar frontend/backend</li>
                <li>Flag USE_MOCK=true no analyticsService.ts</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Como Acessar
              </h2>
              <div className="space-y-4">
                <Link 
                  to="/dashboard/analytics" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Ir para Analytics Dashboard
                </Link>
                <p className="text-blue-700">
                  Ou navegue pelo menu lateral do dashboard e clique em "Analytics"
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Próximos Passos
              </h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-1">
                <li>Sincronizar endpoints do backend com expectativas do frontend</li>
                <li>Implementar endpoints faltantes no backend</li>
                <li>Remover flag USE_MOCK quando backend estiver pronto</li>
                <li>Adicionar testes automatizados</li>
                <li>Otimizar performance das queries de analytics</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}