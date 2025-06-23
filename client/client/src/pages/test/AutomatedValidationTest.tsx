import React, { useState } from 'react';
import { Bot, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { validationService } from '@/services/validationService';
import { toast } from 'react-hot-toast';

export const AutomatedValidationTestPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testAutomatedValidation = async () => {
    setTesting(true);
    setResults(null);

    try {
      // Test 1: Queue a validation
      const queueResult = await validationService.queueAutomatedValidation(
        'test-report-id',
        'test-product-id',
        'HIGH'
      );

      // Test 2: Check queue status
      const queueStatus = await validationService.getAutomatedQueueStatus();

      // Test 3: Get specific queue item
      let queueItem;
      try {
        queueItem = await validationService.getAutomatedQueueItem(queueResult.queueId);
      } catch (error) {
        queueItem = { error: 'Queue item not found' };
      }

      // Test 4: Test validation with rules
      const testAnalysis = {
        microbiological: [
          { parameter: 'Total Bacteria Count', value: 1000, unit: 'CFU/g' },
          { parameter: 'E. coli', value: 0, unit: 'CFU/g' }
        ],
        heavyMetals: [
          { parameter: 'Lead', value: 0.05, unit: 'mg/kg' },
          { parameter: 'Cadmium', value: 0.01, unit: 'mg/kg' }
        ],
        pesticides: [],
        mycotoxins: [],
        nutritional: [
          { parameter: 'Protein', value: 25, unit: 'g/100g' },
          { parameter: 'Fat', value: 10, unit: 'g/100g' }
        ]
      };

      const rulesValidation = await validationService.validateProductWithRules(testAnalysis);

      // Test 5: Check regulatory compliance
      const compliance = await validationService.checkRegulatoryCompliance({
        microbiological: testAnalysis.microbiological,
        heavyMetals: testAnalysis.heavyMetals,
        nutritional: testAnalysis.nutritional
      });

      setResults({
        queueResult,
        queueStatus,
        queueItem,
        rulesValidation,
        compliance
      });

      toast.success('Testes de validação automatizada concluídos!');
    } catch (error: any) {
      console.error('Erro nos testes:', error);
      toast.error('Erro ao executar testes');
      setResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Teste de Validação Automatizada
        </h1>
        
        <p className="text-gray-600 mb-6">
          Teste o sistema de validação automatizada com IA
        </p>

        <button
          onClick={testAutomatedValidation}
          disabled={testing}
          className="btn btn-primary"
        >
          {testing ? (
            <>
              <div className="loading-spinner w-4 h-4 mr-2"></div>
              Testando...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Iniciar Teste
            </>
          )}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Queue Result */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1. Resultado do Enfileiramento
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results.queueResult, null, 2)}
            </pre>
          </div>

          {/* Queue Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              2. Status da Fila
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results.queueStatus, null, 2)}
            </pre>
          </div>

          {/* Queue Item */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              3. Item da Fila
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results.queueItem, null, 2)}
            </pre>
          </div>

          {/* Rules Validation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              4. Validação com Regras
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Status Geral</p>
              <div className="flex items-center gap-2">
                {results.rulesValidation.overallStatus.status === 'approved' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {results.rulesValidation.overallStatus.status === 'conditional' && (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                {results.rulesValidation.overallStatus.status === 'rejected' && (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {results.rulesValidation.overallStatus.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Status Recomendado</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                results.rulesValidation.recommendedStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                results.rulesValidation.recommendedStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {results.rulesValidation.recommendedStatus}
              </span>
            </div>

            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results.rulesValidation, null, 2)}
            </pre>
          </div>

          {/* Compliance Check */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              5. Verificação de Conformidade
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Conformidade</p>
              <div className="flex items-center gap-2">
                {results.compliance.isCompliant ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Conforme</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">Não Conforme</span>
                  </>
                )}
              </div>
            </div>

            {results.compliance.issues.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Problemas</p>
                <ul className="list-disc list-inside space-y-1">
                  {results.compliance.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.compliance.recommendations.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Recomendações</p>
                <ul className="list-disc list-inside space-y-1">
                  {results.compliance.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Raw Results */}
          {results.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Erro</h3>
              <p className="text-red-700">{results.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutomatedValidationTestPage;