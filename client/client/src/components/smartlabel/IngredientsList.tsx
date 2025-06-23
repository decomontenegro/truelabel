import React, { useState } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Leaf,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Ingredient {
  name: string;
  description?: string;
  percentage?: number;
  origin?: string;
  isOrganic?: boolean;
  isAllergen?: boolean;
}

interface IngredientsListProps {
  ingredients?: Ingredient[] | string;
  allergenInfo?: {
    contains: string[];
    mayContain: string[];
    free: string[];
  };
}

export default function IngredientsList({ ingredients, allergenInfo }: IngredientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [showAllergenOnly, setShowAllergenOnly] = useState(false);

  // Parse ingredients if it's a string
  const parseIngredients = (): Ingredient[] => {
    if (!ingredients) return [];
    
    if (typeof ingredients === 'string') {
      // Split by comma and create basic ingredient objects
      return ingredients
        .split(/[,;]/)
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0)
        .map(name => {
          // Check if ingredient is in allergen list
          const isAllergen = allergenInfo?.contains.some(
            allergen => name.toLowerCase().includes(allergen.toLowerCase())
          );
          
          return {
            name,
            isAllergen,
            isOrganic: name.toLowerCase().includes('orgânico') || name.toLowerCase().includes('organic')
          };
        });
    }
    
    return ingredients;
  };

  const ingredientsList = parseIngredients();

  // Filter ingredients based on search and allergen filter
  const filteredIngredients = ingredientsList.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAllergen = !showAllergenOnly || ingredient.isAllergen;
    return matchesSearch && matchesAllergen;
  });

  // Common allergens in Brazil
  const commonAllergens = [
    'leite', 'ovos', 'trigo', 'soja', 'amendoim', 'castanhas', 
    'peixes', 'crustáceos', 'glúten', 'lactose'
  ];

  const isCommonAllergen = (ingredientName: string): boolean => {
    const lowerName = ingredientName.toLowerCase();
    return commonAllergens.some(allergen => lowerName.includes(allergen));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Lista de Ingredientes</h2>
        <p className="text-sm text-gray-600 mt-1">
          {ingredientsList.length} ingredientes listados em ordem decrescente de quantidade
        </p>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => setShowAllergenOnly(!showAllergenOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAllergenOnly
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Apenas Alérgenos
          </button>
        </div>
      </div>

      {/* Allergen Summary */}
      {allergenInfo && (
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Informações sobre Alérgenos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contains */}
            {allergenInfo.contains.length > 0 && (
              <div className="bg-red-100 rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">CONTÉM</h4>
                <ul className="space-y-1">
                  {allergenInfo.contains.map((allergen, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {allergen}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* May Contain */}
            {allergenInfo.mayContain.length > 0 && (
              <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">PODE CONTER</h4>
                <ul className="space-y-1">
                  {allergenInfo.mayContain.map((allergen, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      {allergen}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Free From */}
            {allergenInfo.free.length > 0 && (
              <div className="bg-green-100 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">NÃO CONTÉM</h4>
                <ul className="space-y-1">
                  {allergenInfo.free.map((allergen, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {allergen}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div className="px-6 py-4">
        <div className="space-y-2">
          {filteredIngredients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? 'Nenhum ingrediente encontrado' : 'Nenhum ingrediente listado'}
            </p>
          ) : (
            filteredIngredients.map((ingredient, index) => {
              const isExpanded = expandedIngredient === ingredient.name;
              const hasDetails = ingredient.description || ingredient.origin || ingredient.percentage;
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg transition-all ${
                    ingredient.isAllergen || isCommonAllergen(ingredient.name)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => hasDetails && setExpandedIngredient(
                      isExpanded ? null : ingredient.name
                    )}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-70 transition-colors"
                    disabled={!hasDetails}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        {index + 1}. {ingredient.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {ingredient.isOrganic && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <Leaf className="h-3 w-3 mr-1" />
                            Orgânico
                          </span>
                        )}
                        {(ingredient.isAllergen || isCommonAllergen(ingredient.name)) && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Alérgeno
                          </span>
                        )}
                        {ingredient.percentage && (
                          <span className="text-sm text-gray-600">
                            {ingredient.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                    {hasDetails && (
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    )}
                  </button>

                  {isExpanded && hasDetails && (
                    <div className="px-4 pb-3 space-y-2 border-t border-gray-200">
                      {ingredient.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Descrição:</p>
                          <p className="text-sm text-gray-600">{ingredient.description}</p>
                        </div>
                      )}
                      {ingredient.origin && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Origem:</span> {ingredient.origin}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre a lista de ingredientes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Ingredientes listados em ordem decrescente de quantidade</li>
                <li>• Alérgenos destacados em vermelho para fácil identificação</li>
                <li>• Ingredientes orgânicos marcados com símbolo especial</li>
                <li>• Percentuais exibidos quando disponíveis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}