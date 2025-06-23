import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import { HealthClaim, NutritionFacts } from '@/types/nutrition';
import { nutritionService } from '@/services/nutritionService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { cn } from '@/lib/utils';

interface ClaimsValidatorProps {
  nutritionFacts: NutritionFacts;
  initialClaims?: string[];
  onChange?: (claims: string[]) => void;
  onValidation?: (validatedClaims: HealthClaim[]) => void;
  targetMarket?: 'BRAZIL' | 'USA' | 'EU' | 'MERCOSUL';
}

const ClaimsValidator: React.FC<ClaimsValidatorProps> = ({
  nutritionFacts,
  initialClaims = [],
  onChange,
  onValidation,
  targetMarket = 'BRAZIL'
}) => {
  const [claims, setClaims] = useState<string[]>(initialClaims);
  const [newClaim, setNewClaim] = useState('');
  const [validatedClaims, setValidatedClaims] = useState<HealthClaim[]>([]);
  const [suggestedClaims, setSuggestedClaims] = useState<string[]>([]);

  const { execute: validateClaims, loading: validating } = useAsyncAction(
    async () => {
      const validated = await nutritionService.validateHealthClaims(
        claims,
        nutritionFacts,
        targetMarket
      );
      setValidatedClaims(validated);
      onValidation?.(validated);
      return validated;
    }
  );

  const { execute: loadSuggestions, loading: loadingSuggestions } = useAsyncAction(
    async () => {
      const suggestions = await nutritionService.getSuggestedClaims(
        nutritionFacts,
        targetMarket
      );
      setSuggestedClaims(suggestions);
      return suggestions;
    }
  );

  // Validate claims when they change or nutrition facts change
  useEffect(() => {
    if (claims.length > 0) {
      validateClaims();
    }
  }, [claims, nutritionFacts, targetMarket]);

  // Load suggestions when nutrition facts change
  useEffect(() => {
    loadSuggestions();
  }, [nutritionFacts, targetMarket]);

  const addClaim = () => {
    if (newClaim.trim() && !claims.includes(newClaim.trim())) {
      const updated = [...claims, newClaim.trim()];
      setClaims(updated);
      onChange?.(updated);
      setNewClaim('');
    }
  };

  const removeClaim = (index: number) => {
    const updated = claims.filter((_, i) => i !== index);
    setClaims(updated);
    onChange?.(updated);
  };

  const addSuggestedClaim = (claim: string) => {
    if (!claims.includes(claim)) {
      const updated = [...claims, claim];
      setClaims(updated);
      onChange?.(updated);
    }
  };

  const getClaimStatus = (claim: string): HealthClaim | undefined => {
    return validatedClaims.find(vc => vc.claim === claim);
  };

  const getStatusIcon = (status: HealthClaim['status']) => {
    switch (status) {
      case 'VALID':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'INVALID':
        return <X className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: HealthClaim['status']) => {
    switch (status) {
      case 'VALID':
        return 'bg-green-50 border-green-200';
      case 'INVALID':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getClaimTypeLabel = (type: HealthClaim['type']) => {
    const labels = {
      'NUTRIENT_CONTENT': 'Conteúdo Nutricional',
      'HEALTH': 'Saúde',
      'FUNCTION': 'Funcional',
      'REDUCTION_RISK': 'Redução de Risco'
    };
    return labels[type] || type;
  };

  const validClaimsCount = validatedClaims.filter(c => c.status === 'VALID').length;
  const invalidClaimsCount = validatedClaims.filter(c => c.status === 'INVALID').length;
  const warningClaimsCount = validatedClaims.filter(c => c.status === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {claims.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Válidas</p>
                <p className="text-2xl font-bold text-green-900">{validClaimsCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Avisos</p>
                <p className="text-2xl font-bold text-yellow-900">{warningClaimsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Inválidas</p>
                <p className="text-2xl font-bold text-red-900">{invalidClaimsCount}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Add New Claim */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Adicionar Alegação</h3>
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={newClaim}
              onChange={(e) => setNewClaim(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addClaim()}
              placeholder="Digite uma alegação nutricional ou de saúde..."
              className="input"
            />
          </div>
          <button
            onClick={addClaim}
            disabled={!newClaim.trim()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Suggested Claims */}
      {suggestedClaims.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Alegações Sugeridas</h3>
          <p className="text-sm text-gray-600 mb-4">
            Com base nos dados nutricionais fornecidos, as seguintes alegações podem ser válidas:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedClaims.map((claim, index) => (
              <button
                key={index}
                onClick={() => addSuggestedClaim(claim)}
                disabled={claims.includes(claim)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  claims.includes(claim)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                )}
              >
                {claim}
                {!claims.includes(claim) && (
                  <Plus className="h-3 w-3 ml-1 inline" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Claims */}
      {claims.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Alegações Atuais</h3>
          {validating ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Validando alegações...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, index) => {
                const validation = getClaimStatus(claim);
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 border rounded-lg transition-colors",
                      validation ? getStatusColor(validation.status) : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {validation && getStatusIcon(validation.status)}
                          <h4 className="font-medium text-gray-900">{claim}</h4>
                          {validation && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {getClaimTypeLabel(validation.type)}
                            </span>
                          )}
                        </div>
                        {validation && (
                          <>
                            {validation.evidence && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Evidência:</strong> {validation.evidence}
                              </p>
                            )}
                            {validation.warnings && validation.warnings.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Avisos:</p>
                                <ul className="text-sm text-gray-600 space-y-0.5">
                                  {validation.warnings.map((warning, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-yellow-600 mr-1">•</span>
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {validation.regulation && (
                              <p className="text-xs text-gray-500 mt-2">
                                Regulamentação: {validation.regulation}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeClaim(index)}
                        className="btn-ghost text-red-600 p-2 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Regulatory Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Informações Regulatórias - {targetMarket}</p>
            <ul className="space-y-1 text-xs">
              <li>• Alegações nutricionais devem ser baseadas em valores por 100g/ml ou por porção</li>
              <li>• Alegações de saúde requerem evidência científica aprovada</li>
              <li>• Termos como "light", "zero", "sem" têm critérios específicos</li>
              <li>• Algumas alegações podem requerer advertências adicionais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimsValidator;