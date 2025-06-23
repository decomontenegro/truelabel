import React from 'react';

export interface NutritionValue {
  amount: number;
  unit: string;
  dailyValue?: number;
}

export interface NutritionFactsProps {
  servingSize: string;
  servingsPerContainer?: number;
  calories: number;
  nutrients: {
    totalFat?: NutritionValue;
    saturatedFat?: NutritionValue;
    transFat?: NutritionValue;
    cholesterol?: NutritionValue;
    sodium?: NutritionValue;
    totalCarbohydrate?: NutritionValue;
    dietaryFiber?: NutritionValue;
    totalSugars?: NutritionValue;
    addedSugars?: NutritionValue;
    protein?: NutritionValue;
    vitaminD?: NutritionValue;
    calcium?: NutritionValue;
    iron?: NutritionValue;
    potassium?: NutritionValue;
    [key: string]: NutritionValue | undefined;
  };
}

export const NutritionFactsTable: React.FC<NutritionFactsProps> = ({
  servingSize,
  servingsPerContainer,
  calories,
  nutrients
}) => {
  const formatValue = (value: NutritionValue) => {
    return `${value.amount}${value.unit}`;
  };

  const NutrientRow = ({ 
    label, 
    value, 
    indent = false,
    bold = false 
  }: { 
    label: string; 
    value?: NutritionValue; 
    indent?: boolean;
    bold?: boolean;
  }) => {
    if (!value) return null;

    return (
      <tr className="border-b border-gray-200">
        <td className={`py-1 ${indent ? 'pl-6' : ''} ${bold ? 'font-semibold' : ''}`}>
          {label}
        </td>
        <td className={`py-1 text-right ${bold ? 'font-semibold' : ''}`}>
          {formatValue(value)}
        </td>
        <td className="py-1 text-right font-semibold">
          {value.dailyValue !== undefined ? `${value.dailyValue}%` : ''}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border-4 border-black p-4 max-w-sm font-sans">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-3xl font-black">Informação Nutricional</h2>
      </div>

      {/* Serving Info */}
      <div className="border-b-8 border-black pb-2 mb-2">
        <div className="text-sm">
          <div>Porção: {servingSize}</div>
          {servingsPerContainer && (
            <div>Porções por embalagem: {servingsPerContainer}</div>
          )}
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-4 border-black pb-2 mb-2">
        <div className="flex justify-between items-baseline">
          <span className="font-bold">Valor energético</span>
          <span className="text-4xl font-black">{calories} kcal</span>
        </div>
      </div>

      {/* % Daily Values Header */}
      <div className="text-right text-sm font-bold mb-1">
        % VD*
      </div>

      {/* Nutrients Table */}
      <table className="w-full text-sm">
        <tbody>
          <NutrientRow 
            label="Gorduras totais" 
            value={nutrients.totalFat} 
            bold 
          />
          <NutrientRow 
            label="Gorduras saturadas" 
            value={nutrients.saturatedFat} 
            indent 
          />
          <NutrientRow 
            label="Gorduras trans" 
            value={nutrients.transFat} 
            indent 
          />
          <NutrientRow 
            label="Colesterol" 
            value={nutrients.cholesterol} 
            bold 
          />
          <NutrientRow 
            label="Sódio" 
            value={nutrients.sodium} 
            bold 
          />
          <NutrientRow 
            label="Carboidratos totais" 
            value={nutrients.totalCarbohydrate} 
            bold 
          />
          <NutrientRow 
            label="Fibra alimentar" 
            value={nutrients.dietaryFiber} 
            indent 
          />
          <NutrientRow 
            label="Açúcares totais" 
            value={nutrients.totalSugars} 
            indent 
          />
          <NutrientRow 
            label="Açúcares adicionados" 
            value={nutrients.addedSugars} 
            indent 
          />
          <NutrientRow 
            label="Proteínas" 
            value={nutrients.protein} 
            bold 
          />
        </tbody>
      </table>

      {/* Vitamins and Minerals */}
      {(nutrients.vitaminD || nutrients.calcium || nutrients.iron || nutrients.potassium) && (
        <>
          <div className="border-t-4 border-black mt-2 pt-2">
            <table className="w-full text-sm">
              <tbody>
                <NutrientRow label="Vitamina D" value={nutrients.vitaminD} />
                <NutrientRow label="Cálcio" value={nutrients.calcium} />
                <NutrientRow label="Ferro" value={nutrients.iron} />
                <NutrientRow label="Potássio" value={nutrients.potassium} />
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-black mt-2 pt-2 text-xs">
        <p>* Percentual de valores diários fornecidos pela porção.</p>
        <p>** VD não estabelecido.</p>
      </div>
    </div>
  );
};