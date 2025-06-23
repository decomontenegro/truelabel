import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ValidationRulesDisplay } from '@/components/validations/ValidationRulesDisplay';
import { useValidationRules, useValidationDataFormatter } from '@/hooks/useValidationRules';
import { ProductAnalysis } from '@/config/validationRules';

// Sample test data
const sampleAnalyses = {
  approved: {
    microbiological: [
      { parameter: 'Total Coliforms', value: 100, unit: 'CFU/g' },
      { parameter: 'Escherichia coli', value: 5, unit: 'CFU/g' },
      { parameter: 'Salmonella sp.', value: 0, unit: 'in 25g' },
      { parameter: 'Yeasts and Molds', value: 1000, unit: 'CFU/g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.2, unit: 'mg/kg' },
      { parameter: 'Cadmium (Cd)', value: 0.05, unit: 'mg/kg' },
      { parameter: 'Mercury (Hg)', value: 0.02, unit: 'mg/kg' }
    ],
    nutritional: [
      { parameter: 'Protein', declaredValue: 20, actualValue: 19.5, unit: 'g' },
      { parameter: 'Total Fat', declaredValue: 10, actualValue: 10.5, unit: 'g' },
      { parameter: 'Sodium', declaredValue: 300, actualValue: 320, unit: 'mg' }
    ]
  },
  warning: {
    microbiological: [
      { parameter: 'Total Coliforms', value: 600, unit: 'CFU/g' },
      { parameter: 'Escherichia coli', value: 8, unit: 'CFU/g' },
      { parameter: 'Yeasts and Molds', value: 7000, unit: 'CFU/g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.42, unit: 'mg/kg' },
      { parameter: 'Cadmium (Cd)', value: 0.09, unit: 'mg/kg' }
    ],
    mycotoxins: [
      { parameter: 'Aflatoxin B1', value: 4.5, unit: 'μg/kg' },
      { parameter: 'Ochratoxin A', value: 8.5, unit: 'μg/kg' }
    ]
  },
  rejected: {
    microbiological: [
      { parameter: 'Salmonella sp.', value: 1, unit: 'in 25g' },
      { parameter: 'Total Coliforms', value: 2000, unit: 'CFU/g' },
      { parameter: 'Escherichia coli', value: 50, unit: 'CFU/g' }
    ],
    heavyMetals: [
      { parameter: 'Lead (Pb)', value: 0.8, unit: 'mg/kg' },
      { parameter: 'Mercury (Hg)', value: 0.1, unit: 'mg/kg' }
    ],
    mycotoxins: [
      { parameter: 'Aflatoxin B1', value: 10, unit: 'μg/kg' },
      { parameter: 'Total Aflatoxins (B1+B2+G1+G2)', value: 30, unit: 'μg/kg' }
    ],
    nutritional: [
      { parameter: 'Protein', declaredValue: 25, actualValue: 18, unit: 'g' },
      { parameter: 'Sodium', declaredValue: 500, actualValue: 650, unit: 'mg' }
    ]
  }
};

export default function ValidationRulesTestPage() {
  const navigate = useNavigate();
  const { 
    isValidating, 
    validationResults, 
    overallStatus, 
    feedback, 
    validateAnalysis, 
    clearResults 
  } = useValidationRules();
  const { formatValidationSummary } = useValidationDataFormatter();
  const [selectedScenario, setSelectedScenario] = useState<'approved' | 'warning' | 'rejected' | null>(null);

  const handleTestScenario = (scenario: 'approved' | 'warning' | 'rejected') => {
    setSelectedScenario(scenario);
    const analysis = sampleAnalyses[scenario] as ProductAnalysis;
    validateAnalysis(analysis);
  };

  const handleCustomAnalysis = () => {
    // Custom analysis input would go here
    const customAnalysis: ProductAnalysis = {
      microbiological: [
        { parameter: 'Total Coliforms', value: parseFloat(prompt('Total Coliforms (CFU/g):') || '0'), unit: 'CFU/g' },
        { parameter: 'Salmonella sp.', value: parseFloat(prompt('Salmonella (0=absent, 1=present):') || '0'), unit: 'in 25g' }
      ],
      heavyMetals: [
        { parameter: 'Lead (Pb)', value: parseFloat(prompt('Lead (mg/kg):') || '0'), unit: 'mg/kg' }
      ]
    };
    
    validateAnalysis(customAnalysis);
    setSelectedScenario(null);
  };

  const validationSummary = validationResults && overallStatus 
    ? formatValidationSummary(overallStatus, validationResults)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Teste do Motor de Regras de Validação
          </h1>
          <p className="mt-2 text-gray-600">
            Teste as regras de validação baseadas nas normas regulatórias brasileiras
          </p>
        </div>

        {/* Test Scenarios */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cenários de Teste</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleTestScenario('approved')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedScenario === 'approved' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-500'
              }`}
            >
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">Produto Aprovado</h3>
              <p className="text-sm text-gray-600 mt-1">
                Todos os parâmetros dentro dos limites
              </p>
            </button>

            <button
              onClick={() => handleTestScenario('warning')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedScenario === 'warning' 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-200 hover:border-yellow-500'
              }`}
            >
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium">Aprovação Condicional</h3>
              <p className="text-sm text-gray-600 mt-1">
                Alguns parâmetros em nível de alerta
              </p>
            </button>

            <button
              onClick={() => handleTestScenario('rejected')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedScenario === 'rejected' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-500'
              }`}
            >
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-medium">Produto Reprovado</h3>
              <p className="text-sm text-gray-600 mt-1">
                Parâmetros críticos fora dos limites
              </p>
            </button>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleCustomAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="h-5 w-5 inline mr-2" />
              Testar Análise Customizada
            </button>
            
            {validationResults && (
              <button
                onClick={clearResults}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Limpar Resultados
              </button>
            )}
          </div>
        </div>

        {/* Validation Summary */}
        {validationSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Resumo da Validação</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {validationSummary.statistics.total}
                </div>
                <div className="text-sm text-gray-600">Total de Parâmetros</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {validationSummary.statistics.approved}
                </div>
                <div className="text-sm text-gray-600">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {validationSummary.statistics.warnings}
                </div>
                <div className="text-sm text-gray-600">Alertas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {validationSummary.statistics.rejected}
                </div>
                <div className="text-sm text-gray-600">Reprovados</div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="text-lg">
                Taxa de Aprovação: 
                <span className="font-bold ml-2">{validationSummary.statistics.approvalRate}%</span>
              </div>
            </div>

            {validationSummary.criticalParameters.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">Parâmetros Críticos</h3>
                <ul className="space-y-1">
                  {validationSummary.criticalParameters.map((param, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      • {param.parameter}: {param.value} {param.unit} - {param.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Validation Results Display */}
        {validationResults && overallStatus && feedback && (
          <ValidationRulesDisplay
            validationResults={validationResults}
            overallStatus={overallStatus}
            feedback={feedback}
          />
        )}

        {/* Loading State */}
        {isValidating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Validando análise...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}