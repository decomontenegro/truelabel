import React, { useState } from 'react';
// Temporarily disabled recharts to fix initialization error
// import {
//   LineChart,
//   Line,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   ReferenceLine,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar
// } from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Shield,
  Zap,
  Calendar,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { PredictiveInsights as PredictiveInsightsType } from '@/types/analytics';
import { formatNumber, formatPercent, formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChartPlaceholder from '@/components/ui/ChartPlaceholder';

interface PredictiveAnalyticsProps {
  data: PredictiveInsightsType;
  loading?: boolean;
  onRecommendationAction?: (recommendationId: string) => void;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  data,
  loading = false,
  onRecommendationAction
}) => {
  const [selectedForecast, setSelectedForecast] = useState(0);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'forecasts' | 'anomalies' | 'recommendations' | 'risks'>('forecasts');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'medium':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const renderForecasts = () => {
    const forecast = data.forecasts[selectedForecast];
    if (!forecast) return null;

    return (
      <div className="space-y-6">
        {/* Forecast Selector */}
        <div className="flex items-center justify-between">
          <select
            value={selectedForecast}
            onChange={(e) => setSelectedForecast(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {data.forecasts.map((f, index) => (
              <option key={index} value={index}>
                {f.metric} - {f.period === 'daily' ? 'Diário' : f.period === 'weekly' ? 'Semanal' : 'Mensal'}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Confiança:</span>
            <span className="font-medium text-gray-900">{formatPercent(forecast.confidence * 100)}</span>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Previsão: {forecast.metric}
          </h3>
          <ChartPlaceholder
            type="area"
            title={`Previsão: ${forecast.metric}`}
            height={400}
            message="Gráfico de previsões temporariamente desabilitado"
          />
          <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
            <Info className="h-4 w-4 mr-2" />
            Metodologia: {forecast.methodology}
          </div>
        </div>
      </div>
    );
  };

  const renderAnomalies = () => (
    <div className="space-y-6">
      {/* Anomaly List */}
      {data.anomalies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <p className="text-gray-600">Nenhuma anomalia detectada no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                anomaly.severity === 'high' ? 'border-red-200' :
                anomaly.severity === 'medium' ? 'border-yellow-200' :
                'border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={`h-5 w-5 ${
                      anomaly.severity === 'high' ? 'text-red-600' :
                      anomaly.severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <h4 className="font-semibold text-gray-900">{anomaly.description}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity === 'high' ? 'Alta' : anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Métrica: {anomaly.metric} | Detectada: {formatDate(anomaly.detectedAt, 'dd/MM/yyyy HH:mm')}
                  </p>
                  
                  {anomaly.affectedProducts && anomaly.affectedProducts.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Produtos Afetados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {anomaly.affectedProducts.map((productId) => (
                          <span key={productId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Produto {productId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Possíveis Causas:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {anomaly.possibleCauses.map((cause, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Ações Sugeridas:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {anomaly.suggestedActions.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <ChevronRight className="h-3 w-3 text-gray-400 mr-1 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setExpandedRecommendation(
              expandedRecommendation === recommendation.id ? null : recommendation.id
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getPriorityIcon(recommendation.priority)}
                <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                recommendation.category === 'performance' ? 'bg-purple-100 text-purple-700' :
                recommendation.category === 'engagement' ? 'bg-blue-100 text-blue-700' :
                recommendation.category === 'content' ? 'bg-green-100 text-green-700' :
                recommendation.category === 'timing' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {recommendation.category}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  Impacto: <span className="font-medium text-green-600">
                    +{recommendation.impact.expectedImprovement}%
                  </span>
                </span>
                <span className="text-gray-600">
                  Dificuldade: <span className={`font-medium ${
                    recommendation.implementation.difficulty === 'easy' ? 'text-green-600' :
                    recommendation.implementation.difficulty === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {recommendation.implementation.difficulty === 'easy' ? 'Fácil' :
                     recommendation.implementation.difficulty === 'medium' ? 'Média' : 'Difícil'}
                  </span>
                </span>
              </div>
            </div>

            {expandedRecommendation === recommendation.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Métrica Alvo:</p>
                    <p className="text-gray-600">{recommendation.impact.metric}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Confiança:</p>
                    <p className="text-gray-600">{formatPercent(recommendation.impact.confidence * 100)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Tempo Necessário:</p>
                    <p className="text-gray-600">{recommendation.implementation.timeRequired}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Recursos:</p>
                    <p className="text-gray-600">{recommendation.implementation.resources.join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecommendationAction?.(recommendation.id);
                  }}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Implementar Recomendação
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRiskAssessment = () => {
    const { riskAssessment, opportunityAnalysis } = data;

    // Prepare data for radar chart
    const radarData = riskAssessment.riskFactors.map(factor => ({
      factor: factor.factor,
      risk: factor.score * 100,
      fullMark: 100
    }));

    return (
      <div className="space-y-6">
        {/* Overall Risk Level */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nível de Risco Geral</h3>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              riskAssessment.overallRisk === 'high' ? 'bg-red-100' :
              riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100' :
              'bg-green-100'
            }`}>
              <Shield className={`h-5 w-5 ${
                riskAssessment.overallRisk === 'high' ? 'text-red-600' :
                riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
              <span className={`font-medium ${
                riskAssessment.overallRisk === 'high' ? 'text-red-700' :
                riskAssessment.overallRisk === 'medium' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {riskAssessment.overallRisk === 'high' ? 'Alto' :
                 riskAssessment.overallRisk === 'medium' ? 'Médio' : 'Baixo'}
              </span>
            </div>
          </div>

          {/* Risk Factors Radar */}
          <ChartPlaceholder
            type="radial"
            title="Fatores de Risco"
            height={300}
            message="Gráfico radar temporariamente desabilitado"
          />
        </div>

        {/* Risk Factors Detail */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fatores de Risco Detalhados</h3>
          <div className="space-y-3">
            {riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Probabilidade: {formatPercent(factor.probability * 100)}</span>
                    <span>Impacto: {formatPercent(factor.impact * 100)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    factor.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                    factor.trend === 'decreasing' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {factor.trend === 'increasing' ? '↑ Aumentando' :
                     factor.trend === 'decreasing' ? '↓ Diminuindo' : '→ Estável'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mitigation Strategies */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estratégias de Mitigação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskAssessment.mitigationStrategies.map((strategy, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700">{strategy}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Oportunidades Identificadas</h3>
          <div className="space-y-4">
            {opportunityAnalysis.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Valor Potencial:</span>
                    <span className="font-medium text-green-600 ml-1">
                      R$ {formatNumber(opportunity.potentialValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prazo:</span>
                    <span className="font-medium ml-1">{opportunity.timeframe}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requisitos:</span>
                    <span className="font-medium ml-1">{opportunity.requirements.length} itens</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('forecasts')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'forecasts'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <TrendingUp className="inline h-4 w-4 mr-1" />
          Previsões
        </button>
        <button
          onClick={() => setActiveView('anomalies')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'anomalies'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Anomalias
          {data.anomalies.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
              {data.anomalies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('recommendations')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'recommendations'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <Lightbulb className="inline h-4 w-4 mr-1" />
          Recomendações
          {data.recommendations.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
              {data.recommendations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('risks')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'risks'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <Shield className="inline h-4 w-4 mr-1" />
          Riscos & Oportunidades
        </button>
      </div>

      {/* View Content */}
      {activeView === 'forecasts' && renderForecasts()}
      {activeView === 'anomalies' && renderAnomalies()}
      {activeView === 'recommendations' && renderRecommendations()}
      {activeView === 'risks' && renderRiskAssessment()}
    </div>
  );
};

export default PredictiveAnalytics;