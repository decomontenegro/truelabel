import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export interface AllergenInfoProps {
  contains: string[];
  mayContain?: string[];
  freeFrom?: string[];
  additionalInfo?: string;
}

const allergenIcons: Record<string, string> = {
  'glúten': '🌾',
  'crustáceos': '🦐',
  'ovos': '🥚',
  'peixes': '🐟',
  'amendoim': '🥜',
  'soja': '🌱',
  'leite': '🥛',
  'amêndoas': '🌰',
  'avelãs': '🌰',
  'castanha-de-caju': '🌰',
  'castanha-do-pará': '🌰',
  'macadâmias': '🌰',
  'nozes': '🌰',
  'pecãs': '🌰',
  'pistaches': '🌰',
  'pinoli': '🌰',
  'castanhas': '🌰',
  'aipo': '🥬',
  'mostarda': '🌶️',
  'gergelim': '🌾',
  'dióxido de enxofre': '⚗️',
  'sulfitos': '⚗️',
  'látex': '🧤',
  'moluscos': '🦪'
};

export const AllergenInfo: React.FC<AllergenInfoProps> = ({
  contains,
  mayContain,
  freeFrom,
  additionalInfo
}) => {
  const getAllergenIcon = (allergen: string): string => {
    const key = allergen.toLowerCase();
    return allergenIcons[key] || '⚠️';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Informações sobre Alergênicos
      </h3>

      {/* Contains */}
      {contains.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-2">CONTÉM:</h4>
              <div className="flex flex-wrap gap-2">
                {contains.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    <span className="mr-1 text-lg">{getAllergenIcon(allergen)}</span>
                    {allergen.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* May Contain */}
      {mayContain && mayContain.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 mb-2">PODE CONTER:</h4>
              <div className="flex flex-wrap gap-2">
                {mayContain.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                  >
                    <span className="mr-1 text-lg">{getAllergenIcon(allergen)}</span>
                    {allergen.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free From */}
      {freeFrom && freeFrom.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5">✓</div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2">NÃO CONTÉM:</h4>
              <div className="flex flex-wrap gap-2">
                {freeFrom.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    <span className="mr-1 text-lg">{getAllergenIcon(allergen)}</span>
                    {allergen.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {additionalInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-1">Informações Adicionais:</h4>
              <p className="text-blue-800 text-sm">{additionalInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 italic">
          * Alérgicos: Este produto atende aos requisitos da RDC nº 26/2015 da ANVISA 
          sobre rotulagem obrigatória dos principais alimentos que causam alergias alimentares.
        </p>
      </div>
    </div>
  );
};