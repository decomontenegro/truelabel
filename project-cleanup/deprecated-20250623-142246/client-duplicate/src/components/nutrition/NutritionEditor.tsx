import { useState, useEffect } from 'react';
import { AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import { NutritionFacts, VitaminMineral, ComplianceWarning } from '@/types/nutrition';
import { nutritionService } from '@/services/nutritionService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { cn } from '@/lib/utils';

interface NutritionEditorProps {
  initialData?: Partial<NutritionFacts>;
  onChange: (data: NutritionFacts) => void;
  onValidate?: (warnings: ComplianceWarning[]) => void;
  targetMarket?: 'BRAZIL' | 'USA' | 'EU' | 'MERCOSUL';
  showValidation?: boolean;
}

const NutritionEditor: React.FC<NutritionEditorProps> = ({
  initialData,
  onChange,
  onValidate,
  targetMarket = 'BRAZIL',
  showValidation = true
}) => {
  const [nutritionData, setNutritionData] = useState<Partial<NutritionFacts>>({
    servingSize: 100,
    servingUnit: 'g',
    calories: 0,
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    totalCarbohydrates: 0,
    dietaryFiber: 0,
    totalSugars: 0,
    protein: 0,
    vitamins: [],
    minerals: [],
    ...initialData
  });

  const [warnings, setWarnings] = useState<ComplianceWarning[]>([]);
  const [dailyValues, setDailyValues] = useState<{ [key: string]: number }>({});

  const { execute: validateNutrition, loading: validating } = useAsyncAction(
    async () => {
      const validationWarnings = await nutritionService.getValidationWarnings(nutritionData);
      setWarnings(validationWarnings);
      onValidate?.(validationWarnings);
      return validationWarnings;
    }
  );

  // Load daily value references
  useEffect(() => {
    nutritionService.getDailyValueReferences(targetMarket).then(refs => {
      const dvs: { [key: string]: number } = {};
      Object.entries(refs).forEach(([nutrient, ref]) => {
        const amount = nutritionData[nutrient as keyof NutritionFacts] as number;
        if (amount !== undefined && typeof amount === 'number') {
          dvs[nutrient] = nutritionService.calculateDailyValue(amount, ref.value);
        }
      });
      setDailyValues(dvs);
    });
  }, [nutritionData, targetMarket]);

  // Validate on changes
  useEffect(() => {
    if (showValidation) {
      const timer = setTimeout(() => {
        validateNutrition();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [nutritionData, showValidation]);

  const handleFieldChange = (field: keyof NutritionFacts, value: any) => {
    const updated = { ...nutritionData, [field]: value };
    setNutritionData(updated);
    onChange(updated as NutritionFacts);
  };

  const handleVitaminChange = (index: number, field: keyof VitaminMineral, value: any) => {
    const vitamins = [...(nutritionData.vitamins || [])];
    vitamins[index] = { ...vitamins[index], [field]: value };
    handleFieldChange('vitamins', vitamins);
  };

  const handleMineralChange = (index: number, field: keyof VitaminMineral, value: any) => {
    const minerals = [...(nutritionData.minerals || [])];
    minerals[index] = { ...minerals[index], [field]: value };
    handleFieldChange('minerals', minerals);
  };

  const addVitamin = () => {
    const vitamins = [...(nutritionData.vitamins || [])];
    vitamins.push({ name: '', amount: 0, unit: 'mg' });
    handleFieldChange('vitamins', vitamins);
  };

  const addMineral = () => {
    const minerals = [...(nutritionData.minerals || [])];
    minerals.push({ name: '', amount: 0, unit: 'mg' });
    handleFieldChange('minerals', minerals);
  };

  const removeVitamin = (index: number) => {
    const vitamins = (nutritionData.vitamins || []).filter((_, i) => i !== index);
    handleFieldChange('vitamins', vitamins);
  };

  const removeMineral = (index: number) => {
    const minerals = (nutritionData.minerals || []).filter((_, i) => i !== index);
    handleFieldChange('minerals', minerals);
  };

  const getWarningForField = (field: string): ComplianceWarning | undefined => {
    if (!Array.isArray(warnings)) return undefined;
    return warnings.find(w => w.field === field);
  };

  const renderNutritionInput = (
    label: string,
    field: keyof NutritionFacts,
    unit?: string,
    required = false,
    min = 0,
    step = 0.1
  ) => {
    const warning = Array.isArray(warnings) ? warnings.find(w => w.field === field) : undefined;
    const value = (nutritionData[field] as number) || 0;
    const dv = dailyValues[field];

    return (
      <div key={field} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            min={min}
            step={step}
            className={cn(
              "input flex-1",
              warning && "border-red-500 focus:ring-red-500"
            )}
          />
          {unit && (
            <span className="text-sm text-gray-500 w-12">{unit}</span>
          )}
          {dv !== undefined && (
            <span className="text-sm text-gray-500 w-16">{dv}% DV</span>
          )}
        </div>
        {warning && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-3 w-3 mr-1" />
            {warning.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Serving Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Informações da Porção</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tamanho da Porção <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={nutritionData.servingSize || 0}
              onChange={(e) => handleFieldChange('servingSize', parseFloat(e.target.value) || 0)}
              min={0}
              step={0.1}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade <span className="text-red-500">*</span>
            </label>
            <select
              value={nutritionData.servingUnit || 'g'}
              onChange={(e) => handleFieldChange('servingUnit', e.target.value)}
              className="select"
            >
              <option value="g">g (gramas)</option>
              <option value="ml">ml (mililitros)</option>
              <option value="cup">xícara</option>
              <option value="tbsp">colher de sopa</option>
              <option value="tsp">colher de chá</option>
              <option value="piece">unidade</option>
              <option value="unit">porção</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porções por Embalagem
            </label>
            <input
              type="number"
              value={nutritionData.servingsPerContainer || ''}
              onChange={(e) => handleFieldChange('servingsPerContainer', parseFloat(e.target.value) || undefined)}
              min={0}
              step={0.1}
              className="input"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Energy */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Valor Energético</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderNutritionInput("Calorias", "calories", "kcal", true)}
          {renderNutritionInput("Calorias da Gordura", "caloriesFromFat", "kcal")}
        </div>
      </div>

      {/* Macronutrients */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Macronutrientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderNutritionInput("Gorduras Totais", "totalFat", "g", true)}
          {renderNutritionInput("Gorduras Saturadas", "saturatedFat", "g", true)}
          {renderNutritionInput("Gorduras Trans", "transFat", "g", true)}
          {renderNutritionInput("Gorduras Poli-insaturadas", "polyunsaturatedFat", "g")}
          {renderNutritionInput("Gorduras Monoinsaturadas", "monounsaturatedFat", "g")}
          {renderNutritionInput("Colesterol", "cholesterol", "mg", true)}
          {renderNutritionInput("Sódio", "sodium", "mg", true)}
          {renderNutritionInput("Carboidratos Totais", "totalCarbohydrates", "g", true)}
          {renderNutritionInput("Fibra Alimentar", "dietaryFiber", "g", true)}
          {renderNutritionInput("Açúcares Totais", "totalSugars", "g", true)}
          {renderNutritionInput("Açúcares Adicionados", "addedSugars", "g")}
          {renderNutritionInput("Álcool de Açúcar", "sugarAlcohol", "g")}
          {renderNutritionInput("Proteínas", "protein", "g", true)}
        </div>
      </div>

      {/* Vitamins */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vitaminas</h3>
          <button
            type="button"
            onClick={addVitamin}
            className="btn-outline text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Vitamina
          </button>
        </div>
        <div className="space-y-3">
          {(nutritionData.vitamins || []).map((vitamin, index) => (
            <div key={index} className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={vitamin.name}
                  onChange={(e) => handleVitaminChange(index, 'name', e.target.value)}
                  className="input"
                  placeholder="Ex: Vitamina C"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={vitamin.amount}
                  onChange={(e) => handleVitaminChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="input"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={vitamin.unit}
                  onChange={(e) => handleVitaminChange(index, 'unit', e.target.value)}
                  className="select"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="IU">IU</option>
                  <option value="g">g</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  % VD
                </label>
                <input
                  type="number"
                  value={vitamin.dailyValue || ''}
                  onChange={(e) => handleVitaminChange(index, 'dailyValue', parseFloat(e.target.value) || undefined)}
                  min={0}
                  max={9999}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeVitamin(index)}
                className="btn-ghost text-red-600 p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Minerals */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Minerais</h3>
          <button
            type="button"
            onClick={addMineral}
            className="btn-outline text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Mineral
          </button>
        </div>
        <div className="space-y-3">
          {(nutritionData.minerals || []).map((mineral, index) => (
            <div key={index} className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={mineral.name}
                  onChange={(e) => handleMineralChange(index, 'name', e.target.value)}
                  className="input"
                  placeholder="Ex: Ferro"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={mineral.amount}
                  onChange={(e) => handleMineralChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="input"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={mineral.unit}
                  onChange={(e) => handleMineralChange(index, 'unit', e.target.value)}
                  className="select"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="g">g</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  % VD
                </label>
                <input
                  type="number"
                  value={mineral.dailyValue || ''}
                  onChange={(e) => handleMineralChange(index, 'dailyValue', parseFloat(e.target.value) || undefined)}
                  min={0}
                  max={9999}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMineral(index)}
                className="btn-ghost text-red-600 p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Summary */}
      {showValidation && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Avisos de Validação
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Dicas para Preenchimento:</p>
            <ul className="space-y-1 text-xs">
              <li>• Todos os valores devem ser baseados no tamanho da porção especificada</li>
              <li>• Campos marcados com * são obrigatórios para conformidade regulatória</li>
              <li>• Os valores diários (% VD) são calculados automaticamente com base nas referências do {targetMarket}</li>
              <li>• Adicione vitaminas e minerais relevantes para seu produto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionEditor;