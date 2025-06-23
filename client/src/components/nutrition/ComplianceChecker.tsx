import { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, XCircle, Info, FileText } from 'lucide-react';
import { ComplianceStatus, NutritionFacts, RegulationCompliance } from '@/types/nutrition';
import { nutritionService } from '@/services/nutritionService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { cn } from '@/lib/utils';

interface ComplianceCheckerProps {
  nutritionFacts: NutritionFacts;
  healthClaims: string[];
  productCategory: string;
  targetMarket?: 'BRAZIL' | 'USA' | 'EU' | 'MERCOSUL';
  onComplianceUpdate?: (status: ComplianceStatus) => void;
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({
  nutritionFacts,
  healthClaims,
  productCategory,
  targetMarket = 'BRAZIL',
  onComplianceUpdate
}) => {
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [selectedRegulation, setSelectedRegulation] = useState<string>(targetMarket);
  const [requirements, setRequirements] = useState<any>(null);

  const { execute: checkCompliance, loading } = useAsyncAction(
    async () => {
      const result = await nutritionService.validateNutrition({
        nutritionFacts,
        healthClaims,
        targetMarket,
        productCategory
      });
      setCompliance(result);
      onComplianceUpdate?.(result);
      return result;
    }
  );

  const { execute: loadRequirements } = useAsyncAction(
    async () => {
      const reqs = await nutritionService.getRegulationRequirements(selectedRegulation as any);
      setRequirements(reqs);
      return reqs;
    }
  );

  useEffect(() => {
    checkCompliance();
  }, [nutritionFacts, healthClaims, targetMarket, productCategory]);

  useEffect(() => {
    loadRequirements();
  }, [selectedRegulation]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'NON_COMPLIANT':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'NEEDS_REVIEW':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'NEEDS_REVIEW':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const regulationInfo = {
    'ANVISA': {
      name: 'ANVISA - Brasil',
      description: 'Agência Nacional de Vigilância Sanitária',
      laws: ['RDC nº 429/2020', 'IN nº 75/2020', 'RDC nº 27/2010']
    },
    'FDA': {
      name: 'FDA - Estados Unidos',
      description: 'Food and Drug Administration',
      laws: ['21 CFR 101', 'Nutrition Labeling and Education Act']
    },
    'EU': {
      name: 'União Europeia',
      description: 'Regulamento da UE',
      laws: ['Regulamento (UE) nº 1169/2011', 'Regulamento (CE) nº 1924/2006']
    },
    'MERCOSUL': {
      name: 'MERCOSUL',
      description: 'Mercado Comum do Sul',
      laws: ['GMC/RES. Nº 46/03', 'GMC/RES. Nº 47/03']
    }
  };

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Verificando conformidade...</span>
      </div>
    );
  }

  if (!compliance) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={cn(
        "card p-6 border-2",
        getStatusColor(compliance.overallStatus)
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(compliance.overallStatus)}
            <div>
              <h3 className="text-lg font-semibold">
                Status de Conformidade: {
                  compliance.overallStatus === 'COMPLIANT' ? 'Conforme' :
                  compliance.overallStatus === 'NON_COMPLIANT' ? 'Não Conforme' :
                  'Necessita Revisão'
                }
              </h3>
              <p className="text-sm opacity-75">
                Verificado para o mercado: {targetMarket}
              </p>
            </div>
          </div>
          <Shield className="h-8 w-8 opacity-20" />
        </div>
      </div>

      {/* Regulation Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {compliance.regulations.map((reg) => (
              <button
                key={reg.regulation}
                onClick={() => setSelectedRegulation(reg.regulation)}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm",
                  selectedRegulation === reg.regulation
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(reg.status)}
                  <span>{reg.regulation}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Regulation Details */}
        <div className="p-6">
          {compliance.regulations
            .filter(reg => reg.regulation === selectedRegulation)
            .map((reg) => (
              <div key={reg.regulation} className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {regulationInfo[reg.regulation]?.name || reg.regulation}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {regulationInfo[reg.regulation]?.description}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  getStatusColor(reg.status)
                )}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(reg.status)}
                    <div className="flex-1">
                      <p className="font-medium">
                        {reg.status === 'COMPLIANT' ? 'Conformidade Total' :
                         reg.status === 'NON_COMPLIANT' ? 'Não Conforme' :
                         'Conformidade Parcial'}
                      </p>
                      <p className="text-sm mt-1">{reg.details}</p>
                      <p className="text-xs mt-2 opacity-75">
                        Última verificação: {new Date(reg.lastChecked).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Regulation Laws */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Legislação Aplicável:
                  </h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {regulationInfo[reg.regulation]?.laws.map((law, index) => (
                      <li key={index} className="flex items-center">
                        <FileText className="h-3 w-3 mr-2 text-gray-400" />
                        {law}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Warnings */}
      {compliance.warnings.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Avisos e Recomendações</h3>
          <div className="space-y-3">
            {compliance.warnings.map((warning, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border",
                  warning.severity === 'ERROR' ? "bg-red-50 border-red-200" :
                  warning.severity === 'WARNING' ? "bg-yellow-50 border-yellow-200" :
                  "bg-blue-50 border-blue-200"
                )}
              >
                <div className="flex items-start space-x-3">
                  {getWarningIcon(warning.severity)}
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      warning.severity === 'ERROR' ? "text-red-800" :
                      warning.severity === 'WARNING' ? "text-yellow-800" :
                      "text-blue-800"
                    )}>
                      {warning.field}
                    </p>
                    <p className={cn(
                      "text-sm mt-1",
                      warning.severity === 'ERROR' ? "text-red-700" :
                      warning.severity === 'WARNING' ? "text-yellow-700" :
                      "text-blue-700"
                    )}>
                      {warning.message}
                    </p>
                    {warning.regulation && (
                      <p className="text-xs mt-1 opacity-75">
                        Regulamentação: {warning.regulation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {compliance.suggestions.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sugestões de Melhoria</h3>
          <ul className="space-y-2">
            {compliance.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements */}
      {requirements && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Requisitos - {regulationInfo[selectedRegulation]?.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Campos Obrigatórios:</h4>
              <div className="flex flex-wrap gap-2">
                {requirements.requiredFields.map((field: string) => (
                  <span key={field} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Campos Opcionais:</h4>
              <div className="flex flex-wrap gap-2">
                {requirements.optionalFields.map((field: string) => (
                  <span key={field} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Requisitos de Rotulagem:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {requirements.labelingRequirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Restrições de Alegações:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {requirements.claimRestrictions.map((restriction: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-400 mr-2">✗</span>
                    {restriction}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;