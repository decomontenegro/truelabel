import React, { useState } from 'react';
import { Info, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

interface NutrientInfo {
  name: string;
  amount: string;
  unit?: string;
  dailyValue?: string;
  subNutrients?: NutrientInfo[];
}

interface NutritionPanelProps {
  nutritionalInfo: any;
  servingSize?: string;
  servingsPerPackage?: number;
  highlights?: {
    label: string;
    value: string;
    icon?: string;
    color?: string;
  }[];
}

export default function NutritionPanel({ 
  nutritionalInfo, 
  servingSize, 
  servingsPerPackage,
  highlights 
}: NutritionPanelProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [servings, setServings] = useState(1);

  // Parse nutritional info into structured format
  const parseNutrients = (): NutrientInfo[] => {
    if (!nutritionalInfo) return [];

    // If it's already in the structured format
    if (nutritionalInfo.nutrients && Array.isArray(nutritionalInfo.nutrients)) {
      return nutritionalInfo.nutrients;
    }

    // If it's a simple object, convert it
    if (typeof nutritionalInfo === 'object') {
      return Object.entries(nutritionalInfo).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        amount: String(value),
        unit: 'g' // default unit
      }));
    }

    return [];
  };

  const nutrients = parseNutrients();

  const calculateValue = (amount: string): string => {
    const numericValue = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) return amount;
    
    const calculated = numericValue * servings;
    const unit = amount.replace(/[\d.-]/g, '').trim();
    
    return `${calculated.toFixed(1)}${unit}`;
  };

  const getDVColor = (dv: string): string => {
    const value = parseInt(dv);
    if (value >= 20) return 'text-red-600 font-semibold';
    if (value >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Informação Nutricional</h2>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Calculator className="h-5 w-5" />
            <span className="text-sm font-medium">Calculadora</span>
          </button>
        </div>
      </div>

      {/* Serving Info */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Porção</p>
            <p className="font-semibold text-gray-900">
              {nutritionalInfo?.servingSize || servingSize || '100g'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Porções por embalagem</p>
            <p className="font-semibold text-gray-900">
              {nutritionalInfo?.servingsPerPackage || servingsPerPackage || 'Cerca de 10'}
            </p>
          </div>
        </div>
      </div>

      {/* Calculator */}
      {showCalculator && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Número de porções:</span>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={servings}
                onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </label>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Valores ajustados para {servings} {servings === 1 ? 'porção' : 'porções'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Destaques Nutricionais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {highlights.map((highlight, index) => (
              <div 
                key={index}
                className={`text-center p-3 rounded-lg bg-${highlight.color || 'gray'}-50 border border-${highlight.color || 'gray'}-200`}
              >
                {highlight.icon && <div className="text-2xl mb-1">{highlight.icon}</div>}
                <p className="text-xs font-medium text-gray-700">{highlight.label}</p>
                {highlight.value && <p className="text-sm font-bold text-gray-900">{highlight.value}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrients Table */}
      <div className="px-6 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-2 font-bold text-gray-900">Nutrientes</th>
              <th className="text-right py-2 font-bold text-gray-900 w-24">Quantidade</th>
              {nutrients.some(n => n.dailyValue) && (
                <th className="text-right py-2 font-bold text-gray-900 w-20">%VD*</th>
              )}
            </tr>
          </thead>
          <tbody>
            {nutrients.map((nutrient, index) => (
              <React.Fragment key={index}>
                <tr className={`border-b border-gray-200 ${nutrient.subNutrients ? 'font-semibold' : ''}`}>
                  <td className="py-2 text-gray-900">{nutrient.name}</td>
                  <td className="text-right py-2 text-gray-900">
                    {showCalculator && servings !== 1 
                      ? calculateValue(nutrient.amount)
                      : nutrient.amount
                    }
                    {nutrient.unit && ` ${nutrient.unit}`}
                  </td>
                  {nutrient.dailyValue && (
                    <td className={`text-right py-2 ${getDVColor(nutrient.dailyValue)}`}>
                      {nutrient.dailyValue}
                    </td>
                  )}
                </tr>
                {nutrient.subNutrients && nutrient.subNutrients.map((sub, subIndex) => (
                  <tr key={`${index}-${subIndex}`} className="border-b border-gray-100">
                    <td className="py-1 pl-6 text-gray-700 text-sm">{sub.name}</td>
                    <td className="text-right py-1 text-gray-700 text-sm">
                      {showCalculator && servings !== 1 
                        ? calculateValue(sub.amount)
                        : sub.amount
                      }
                      {sub.unit && ` ${sub.unit}`}
                    </td>
                    {sub.dailyValue && (
                      <td className={`text-right py-1 text-sm ${getDVColor(sub.dailyValue)}`}>
                        {sub.dailyValue}
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Daily Value Notice */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 leading-relaxed">
            * % Valores Diários de referência com base em uma dieta de 2.000 kcal ou 8400 kJ. 
            Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
          </p>
        </div>

        {/* High DV Warning */}
        {nutrients.some(n => n.dailyValue && parseInt(n.dailyValue) >= 20) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Atenção aos valores diários
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Este produto contém nutrientes com alto percentual de valores diários. 
                  Consuma com moderação como parte de uma dieta equilibrada.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}