import React from 'react';
import { Bot, Clock, CheckCircle, AlertTriangle, BarChart } from 'lucide-react';
import { AnalysisResult, Validation } from '@/types';

interface AutomatedValidationStatusProps {
  validation: Validation;
  analysis?: AnalysisResult;
}

export const AutomatedValidationStatus: React.FC<AutomatedValidationStatusProps> = ({ validation, analysis }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'LOW':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-600" />
            Análise Automatizada
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(validation.confidence || 0)}`}>
            {validation.confidence}% Confiança
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Algoritmo</p>
            <p className="text-sm font-medium text-gray-900">{analysis.algorithm} v{analysis.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tempo de Processamento</p>
            <p className="text-sm font-medium text-gray-900">
              {(analysis.processingTime / 1000).toFixed(2)}s
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Data da Análise</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(analysis.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Descobertas da Análise</h3>
        
        <div className="space-y-3">
          {analysis.findings.map((finding, index) => (
            <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
              <div className="flex items-start">
                {getSeverityIcon(finding.severity)}
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {finding.dataPoint}
                    </p>
                    <span className="text-xs text-gray-500">
                      {finding.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {finding.description}
                  </p>
                  {finding.evidence && (
                    <p className="text-xs text-gray-500 mt-1">
                      Evidência: {finding.evidence}
                    </p>
                  )}
                  {finding.suggestedAction && (
                    <p className="text-sm text-blue-600 mt-2">
                      <strong>Ação sugerida:</strong> {finding.suggestedAction}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {analysis.findings.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhuma descoberta significativa
          </p>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendações</h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart className="w-5 h-5 mr-2" />
          Detalhamento da Confiança
        </h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Precisão dos Dados</span>
              <span className="font-medium">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Conformidade Regulatória</span>
              <span className="font-medium">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Consistência</span>
              <span className="font-medium">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};