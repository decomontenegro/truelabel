import React from 'react';

interface ColorSwatchProps {
  name: string;
  value: string;
  className: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, value, className }) => (
  <div className="flex flex-col items-center space-y-2">
    <div className={`w-16 h-16 rounded-lg border border-gray-200 ${className}`}></div>
    <div className="text-center">
      <div className="text-sm font-medium text-gray-900">{name}</div>
      <div className="text-xs text-gray-500 font-mono">{value}</div>
    </div>
  </div>
);

const ColorPalette: React.FC = () => {
  const primaryColors = [
    { name: 'primary-50', value: '#eff6ff', className: 'bg-primary-50' },
    { name: 'primary-100', value: '#dbeafe', className: 'bg-primary-100' },
    { name: 'primary-200', value: '#bfdbfe', className: 'bg-primary-200' },
    { name: 'primary-300', value: '#93c5fd', className: 'bg-primary-300' },
    { name: 'primary-400', value: '#60a5fa', className: 'bg-primary-400' },
    { name: 'primary-500', value: '#3b82f6', className: 'bg-primary-500' },
    { name: 'primary-600', value: '#2563eb', className: 'bg-primary-600' },
    { name: 'primary-700', value: '#1d4ed8', className: 'bg-primary-700' },
    { name: 'primary-800', value: '#1e40af', className: 'bg-primary-800' },
    { name: 'primary-900', value: '#1e3a8a', className: 'bg-primary-900' },
  ];

  const brandColors = [
    { name: 'brand-blue', value: '#2563eb', className: 'bg-brand-blue' },
    { name: 'brand-blue-light', value: '#3b82f6', className: 'bg-brand-blue-light' },
    { name: 'brand-white', value: '#ffffff', className: 'bg-brand-white border' },
    { name: 'brand-black', value: '#000000', className: 'bg-brand-black' },
    { name: 'brand-lilac', value: '#c4b5fd', className: 'bg-brand-lilac' },
    { name: 'brand-lilac-light', value: '#e0e7ff', className: 'bg-brand-lilac-light' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">True Label - Paleta de Cores</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cores Primárias (Azul)</h3>
            <div className="grid grid-cols-5 gap-4">
              {primaryColors.map((color) => (
                <ColorSwatch key={color.name} {...color} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cores da Marca</h3>
            <div className="grid grid-cols-3 gap-4">
              {brandColors.map((color) => (
                <ColorSwatch key={color.name} {...color} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Uso Recomendado:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>primary-600:</strong> Botões primários, links importantes</li>
            <li><strong>primary-500:</strong> Hover states, elementos secundários</li>
            <li><strong>brand-lilac:</strong> Acentos, badges, notificações</li>
            <li><strong>primary-50-100:</strong> Fundos suaves, cards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;
