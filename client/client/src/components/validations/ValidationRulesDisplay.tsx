import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { ValidationResult } from '@/config/validationRules';

interface ValidationRulesDisplayProps {
  validationResults: ValidationResult[];
  overallStatus: {
    status: 'approved' | 'conditional' | 'rejected';
    summary: string;
    criticalIssues: number;
    warnings: number;
  };
  feedback: {
    microbiological: string[];
    chemical: string[];
    nutritional: string[];
    recommendations: string[];
  };
}

export const ValidationRulesDisplay: React.FC<ValidationRulesDisplayProps> = ({
  validationResults,
  overallStatus,
  feedback
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'conditional':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getParameterCategory = (parameter: string): string => {
    const param = parameter.toLowerCase();
    if (param.includes('coliform') || param.includes('salmonella') || 
        param.includes('listeria') || param.includes('coli') ||
        param.includes('yeast') || param.includes('mold')) {
      return 'Microbiológico';
    } else if (param.includes('lead') || param.includes('cadmium') || 
               param.includes('mercury') || param.includes('arsenic') ||
               param.includes('aflatoxin') || param.includes('pesticide')) {
      return 'Químico';
    } else {
      return 'Nutricional';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div className={`rounded-lg border-2 p-6 ${getStatusColor(overallStatus.status)}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {overallStatus.status === 'approved' && <Check className="h-8 w-8" />}
            {overallStatus.status === 'conditional' && <AlertTriangle className="h-8 w-8" />}
            {overallStatus.status === 'rejected' && <X className="h-8 w-8" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {overallStatus.status === 'approved' && 'Produto Aprovado'}
              {overallStatus.status === 'conditional' && 'Aprovação Condicional'}
              {overallStatus.status === 'rejected' && 'Produto Reprovado'}
            </h3>
            <p className="mt-1">{overallStatus.summary}</p>
            <div className="mt-3 flex gap-4 text-sm">
              {overallStatus.criticalIssues > 0 && (
                <span className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {overallStatus.criticalIssues} problemas críticos
                </span>
              )}
              {overallStatus.warnings > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {overallStatus.warnings} alertas
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resultados Detalhados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parâmetro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referência
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validationResults.map((result, index) => (
                <tr key={index} className={result.status === 'rejected' ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.parameter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getParameterCategory(result.parameter)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.value} {result.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-2 text-sm capitalize">{result.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.regulatoryReference || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Análise por Categoria</h3>
          <div className="space-y-4">
            {feedback.microbiological.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Microbiológico</h4>
                <ul className="space-y-1">
                  {feedback.microbiological.map((msg, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.chemical.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Químico</h4>
                <ul className="space-y-1">
                  {feedback.chemical.map((msg, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.nutritional.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Nutricional</h4>
                <ul className="space-y-1">
                  {feedback.nutritional.map((msg, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {feedback.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendações</h3>
            <ul className="space-y-2">
              {feedback.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Regulatory References */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Referências Regulatórias</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Normas Aplicadas:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• ANVISA RDC 331/2019 - Padrões microbiológicos</li>
              <li>• ANVISA RDC 722/2022 - Limites de contaminantes</li>
              <li>• ANVISA RDC 723/2022 - Limites de micotoxinas</li>
              <li>• ANVISA RDC 429/2020 - Rotulagem nutricional</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Tolerâncias Nutricionais:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Macronutrientes: ±20%</li>
              <li>• Micronutrientes ≥100mg/μg: ±20%</li>
              <li>• Micronutrientes &lt;100mg/μg: ±45%</li>
              <li>• Sódio: +20% (sem limite inferior)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationRulesDisplay;