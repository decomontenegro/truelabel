import React from 'react';
import { MapPin, Leaf, Calendar, Award, TrendingUp } from 'lucide-react';
import { IngredientOrigin } from '@/services/traceabilityService';

interface OriginDetailsProps {
  ingredients: IngredientOrigin[];
  className?: string;
}

export const OriginDetails: React.FC<OriginDetailsProps> = ({ ingredients, className = '' }) => {
  const getSustainabilityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getSustainabilityLabel = (score?: number) => {
    if (!score) return 'Not rated';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs improvement';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Ingredient Origins</h3>
      
      <div className="space-y-6">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.ingredientId}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-medium text-gray-900">{ingredient.name}</h4>
                <p className="text-sm text-gray-500 mt-1">Supplied by {ingredient.supplier}</p>
              </div>
              {ingredient.sustainabilityScore !== undefined && (
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getSustainabilityColor(
                    ingredient.sustainabilityScore
                  )}`}
                >
                  <TrendingUp className="w-4 h-4 inline-block mr-1" />
                  {ingredient.sustainabilityScore}% {getSustainabilityLabel(ingredient.sustainabilityScore)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin Info */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Origin</p>
                    <p className="text-sm text-gray-600">
                      {ingredient.origin.region}, {ingredient.origin.country}
                    </p>
                    {ingredient.origin.farm && (
                      <p className="text-xs text-gray-500 mt-1">Farm: {ingredient.origin.farm}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timeline</p>
                    {ingredient.harvestDate && (
                      <p className="text-sm text-gray-600">
                        Harvested: {new Date(ingredient.harvestDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Arrived: {new Date(ingredient.arrivalDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Leaf className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Quantity</p>
                    <p className="text-sm text-gray-600">
                      {ingredient.quantity} {ingredient.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Certifications</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredient.certifications.length > 0 ? (
                    ingredient.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                      >
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No certifications</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
            <p className="text-sm text-gray-500">Total Ingredients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(ingredients.map(i => i.origin.country)).size}
            </p>
            <p className="text-sm text-gray-500">Countries</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {ingredients.reduce((sum, i) => sum + i.certifications.length, 0)}
            </p>
            <p className="text-sm text-gray-500">Certifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};