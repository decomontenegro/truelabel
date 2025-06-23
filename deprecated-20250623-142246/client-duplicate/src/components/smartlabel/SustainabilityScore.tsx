import React, { useState } from 'react';
import { 
  Leaf, 
  Droplets, 
  Package, 
  Truck,
  Factory,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';

interface SustainabilityMetric {
  metric: string;
  value: number;
  unit: string;
  comparison?: string;
}

interface SustainabilityScoreProps {
  sustainabilityScore?: {
    overall: number;
    carbonFootprint: number;
    waterUsage: number;
    packaging: number;
    transportation: number;
    details?: SustainabilityMetric[];
  };
  traceability?: any;
}

export default function SustainabilityScore({ sustainabilityScore, traceability }: SustainabilityScoreProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!sustainabilityScore) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Dados de sustentabilidade não disponíveis</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Precisa Melhorar';
  };

  const categories = [
    {
      id: 'carbon',
      name: 'Pegada de Carbono',
      icon: Factory,
      score: sustainabilityScore.carbonFootprint,
      description: 'Emissões de CO2 durante produção e transporte',
      tips: [
        'Produção com energia renovável',
        'Otimização de processos industriais',
        'Compensação de carbono certificada'
      ]
    },
    {
      id: 'water',
      name: 'Uso de Água',
      icon: Droplets,
      score: sustainabilityScore.waterUsage,
      description: 'Eficiência no consumo de recursos hídricos',
      tips: [
        'Sistema de reuso de água',
        'Captação de água da chuva',
        'Processos de baixo consumo hídrico'
      ]
    },
    {
      id: 'packaging',
      name: 'Embalagem',
      icon: Package,
      score: sustainabilityScore.packaging,
      description: 'Sustentabilidade dos materiais de embalagem',
      tips: [
        'Materiais recicláveis ou biodegradáveis',
        'Redução de plástico',
        'Design otimizado para menor desperdício'
      ]
    },
    {
      id: 'transport',
      name: 'Transporte',
      icon: Truck,
      score: sustainabilityScore.transportation,
      description: 'Eficiência logística e modal de transporte',
      tips: [
        'Uso de veículos elétricos ou híbridos',
        'Otimização de rotas',
        'Produção local quando possível'
      ]
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Leaf className="h-7 w-7 text-green-600 mr-2" />
              Índice de Sustentabilidade
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Avaliação do impacto ambiental do produto
            </p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Pontuação Geral</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold text-gray-900">
                {sustainabilityScore.overall}
              </span>
              <span className="text-xl text-gray-500">/100</span>
            </div>
            <div className="mt-2">
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                bg-${getScoreColor(sustainabilityScore.overall)}-100 
                text-${getScoreColor(sustainabilityScore.overall)}-800
              `}>
                <Award className="h-4 w-4 mr-1" />
                {getScoreLabel(sustainabilityScore.overall)}
              </span>
            </div>
          </div>

          {/* Visual Score Ring */}
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(sustainabilityScore.overall / 100) * 352} 352`}
                className={`text-${getScoreColor(sustainabilityScore.overall)}-500`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className={`h-12 w-12 text-${getScoreColor(sustainabilityScore.overall)}-600`} />
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-6">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-${getScoreColor(sustainabilityScore.overall)}-400 to-${getScoreColor(sustainabilityScore.overall)}-600 transition-all duration-1000`}
              style={{ width: `${sustainabilityScore.overall}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="p-6 space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedSection === category.id;
          const color = getScoreColor(category.score);

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : category.id)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${color}-500`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {category.score}%
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-white space-y-3">
                  <p className="text-sm text-gray-600">{category.description}</p>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Iniciativas implementadas:</p>
                    <ul className="space-y-1">
                      {category.tips.map((tip, index) => (
                        <li key={index} className="flex items-start text-xs text-gray-600">
                          <TrendingDown className="h-3 w-3 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Metrics */}
      {sustainabilityScore.details && sustainabilityScore.details.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Métricas Detalhadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sustainabilityScore.details.map((detail, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700">{detail.metric}</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{detail.value}</span>
                  <span className="text-sm text-gray-600">{detail.unit}</span>
                </div>
                {detail.comparison && (
                  <p className="text-xs text-green-600 mt-1">{detail.comparison}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traceability Info */}
      {traceability && traceability.origin && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Rastreabilidade</p>
                <p className="text-xs text-blue-700 mt-1">
                  Produto originário de {traceability.origin.location}
                  {traceability.origin.farm && ` - ${traceability.origin.farm}`}
                </p>
                {traceability.processing && (
                  <p className="text-xs text-blue-700">
                    Processado em {traceability.processing.facility}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}