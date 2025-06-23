import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info, Star } from 'lucide-react';
import { NutritionComparison, NutritionScores } from '@/types/nutrition';
import { nutritionService } from '@/services/nutritionService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { cn } from '@/lib/utils';

interface NutritionalComparisonProps {
  productIds: string[];
  onProductRemove?: (productId: string) => void;
}

const NutritionalComparison: React.FC<NutritionalComparisonProps> = ({
  productIds,
  onProductRemove
}) => {
  const [comparisons, setComparisons] = useState<NutritionComparison[]>([]);
  const [selectedNutrients, setSelectedNutrients] = useState<string[]>([
    'calories', 'totalFat', 'saturatedFat', 'sodium', 'totalCarbohydrates', 
    'dietaryFiber', 'totalSugars', 'protein'
  ]);

  const { execute: loadComparisons, loading } = useAsyncAction(
    async () => {
      if (productIds.length === 0) return;
      const data = await nutritionService.compareProducts(productIds);
      setComparisons(data);
      return data;
    }
  );

  useEffect(() => {
    loadComparisons();
  }, [productIds]);

  const nutrientLabels: { [key: string]: string } = {
    calories: 'Calorias',
    totalFat: 'Gorduras Totais',
    saturatedFat: 'Gorduras Saturadas',
    transFat: 'Gorduras Trans',
    cholesterol: 'Colesterol',
    sodium: 'Sódio',
    totalCarbohydrates: 'Carboidratos',
    dietaryFiber: 'Fibras',
    totalSugars: 'Açúcares',
    protein: 'Proteínas'
  };

  const nutrientUnits: { [key: string]: string } = {
    calories: 'kcal',
    cholesterol: 'mg',
    sodium: 'mg',
    default: 'g'
  };

  const getUnit = (nutrient: string): string => {
    return nutrientUnits[nutrient] || nutrientUnits.default;
  };

  const getNutrientValue = (comparison: NutritionComparison, nutrient: string): number => {
    return (comparison.nutritionFacts as any)[nutrient] || 0;
  };

  const getPercentageDiff = (value: number, categoryAvg: number): string => {
    if (!categoryAvg || categoryAvg === 0) return '';
    const diff = ((value - categoryAvg) / categoryAvg) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)}%`;
  };

  const getScoreColor = (score?: string | number): string => {
    if (!score) return 'bg-gray-100';
    
    if (typeof score === 'string') {
      // Nutri-Score
      const colors = {
        'A': 'bg-green-500',
        'B': 'bg-green-400',
        'C': 'bg-yellow-400',
        'D': 'bg-orange-400',
        'E': 'bg-red-500'
      };
      return colors[score as keyof typeof colors] || 'bg-gray-100';
    } else {
      // Health Star Rating
      if (score >= 4) return 'bg-green-500';
      if (score >= 3) return 'bg-green-400';
      if (score >= 2) return 'bg-yellow-400';
      return 'bg-orange-400';
    }
  };

  const renderNutriScore = (score?: NutritionScores) => {
    if (!score?.nutriScore) return null;
    
    return (
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold",
          getScoreColor(score.nutriScore)
        )}>
          {score.nutriScore}
        </div>
        <p className="text-xs text-gray-600 mt-1">Nutri-Score</p>
      </div>
    );
  };

  const renderHealthStarRating = (score?: NutritionScores) => {
    if (!score?.healthStarRating) return null;
    
    const fullStars = Math.floor(score.healthStarRating);
    const hasHalfStar = score.healthStarRating % 1 !== 0;
    
    return (
      <div className="text-center">
        <div className="flex items-center justify-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < fullStars ? "fill-yellow-400 text-yellow-400" :
                i === fullStars && hasHalfStar ? "fill-yellow-400 text-yellow-400 opacity-50" :
                "text-gray-300"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">{score.healthStarRating}/5</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Carregando comparação nutricional...</span>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">Selecione produtos para comparar</p>
      </div>
    );
  }

  const hasScores = comparisons.some(c => c.scores);
  const hasCategoryAverage = comparisons.some(c => c.categoryAverage);

  return (
    <div className="space-y-6">
      {/* Header with Scores */}
      {hasScores && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Pontuações Nutricionais</h3>
          <div className={`grid grid-cols-1 md:grid-cols-${comparisons.length} gap-4`}>
            {comparisons.map((comparison) => (
              <div key={comparison.productId} className="text-center">
                <h4 className="font-medium text-gray-900 mb-3">{comparison.productName}</h4>
                <div className="flex items-center justify-center space-x-4">
                  {renderNutriScore(comparison.scores)}
                  {renderHealthStarRating(comparison.scores)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrient Comparison Table */}
      <div className="card p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Comparação Nutricional</h3>
        
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Nutriente</th>
              {comparisons.map((comparison) => (
                <th key={comparison.productId} className="text-center py-3 px-4">
                  <div className="font-medium text-gray-900">{comparison.productName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Por {comparison.nutritionFacts.servingSize}{comparison.nutritionFacts.servingUnit}
                  </div>
                </th>
              ))}
              {hasCategoryAverage && (
                <th className="text-center py-3 px-4">
                  <div className="font-medium text-gray-700">Média da Categoria</div>
                  <div className="text-xs text-gray-500 mt-1">Por 100g</div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {selectedNutrients.map((nutrient) => {
              const maxValue = Math.max(...comparisons.map(c => getNutrientValue(c, nutrient)));
              
              return (
                <tr key={nutrient} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">
                    {nutrientLabels[nutrient]}
                  </td>
                  {comparisons.map((comparison) => {
                    const value = getNutrientValue(comparison, nutrient);
                    const categoryAvg = comparison.categoryAverage ? 
                      getNutrientValue({ nutritionFacts: comparison.categoryAverage } as any, nutrient) : 0;
                    const percentDiff = getPercentageDiff(value, categoryAvg);
                    const isMax = value === maxValue && comparisons.length > 1;
                    
                    return (
                      <td key={comparison.productId} className="text-center py-3 px-4">
                        <div className={cn(
                          "font-medium",
                          isMax ? "text-primary-600" : "text-gray-900"
                        )}>
                          {value.toFixed(1)} {getUnit(nutrient)}
                        </div>
                        {percentDiff && (
                          <div className={cn(
                            "text-xs mt-1",
                            percentDiff.startsWith('+') ? "text-red-600" : "text-green-600"
                          )}>
                            {percentDiff}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {hasCategoryAverage && comparisons[0]?.categoryAverage && (
                    <td className="text-center py-3 px-4 text-gray-600">
                      {getNutrientValue({ nutritionFacts: comparisons[0].categoryAverage } as any, nutrient).toFixed(1)} {getUnit(nutrient)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual Comparison */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Comparação Visual</h3>
        
        <div className="space-y-6">
          {selectedNutrients.map((nutrient) => {
            const maxValue = Math.max(...comparisons.map(c => getNutrientValue(c, nutrient)));
            
            return (
              <div key={nutrient}>
                <h4 className="font-medium text-gray-700 mb-3">{nutrientLabels[nutrient]}</h4>
                <div className="space-y-2">
                  {comparisons.map((comparison) => {
                    const value = getNutrientValue(comparison, nutrient);
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={comparison.productId} className="flex items-center">
                        <div className="w-32 text-sm text-gray-600 truncate">
                          {comparison.productName}
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="relative bg-gray-200 rounded-full h-6">
                            <div
                              className={cn(
                                "absolute top-0 left-0 h-full rounded-full transition-all",
                                nutrient === 'dietaryFiber' || nutrient === 'protein' 
                                  ? "bg-green-500" 
                                  : nutrient === 'sodium' || nutrient === 'saturatedFat' || nutrient === 'transFat'
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700 w-20 text-right">
                          {value.toFixed(1)} {getUnit(nutrient)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Dicas de Comparação:</p>
            <ul className="space-y-1 text-xs">
              <li>• Valores em verde indicam nutrientes benéficos (fibras, proteínas)</li>
              <li>• Valores em vermelho indicam nutrientes a serem consumidos com moderação</li>
              <li>• Compare produtos da mesma categoria para resultados mais relevantes</li>
              <li>• Considere o tamanho da porção ao fazer comparações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionalComparison;