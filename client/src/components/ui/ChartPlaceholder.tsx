import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

interface ChartPlaceholderProps {
  type?: 'line' | 'bar' | 'pie' | 'area' | 'radial';
  title?: string;
  height?: number;
  message?: string;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({
  type = 'line',
  title = 'Gráfico',
  height = 300,
  message = 'Gráfico temporariamente desabilitado'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-12 w-12 text-gray-400" />;
      case 'pie':
      case 'radial':
        return <PieChart className="h-12 w-12 text-gray-400" />;
      case 'area':
        return <Activity className="h-12 w-12 text-gray-400" />;
      default:
        return <TrendingUp className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
      style={{ height: `${height}px` }}
    >
      {getIcon()}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
        {message}
      </p>
      <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-xs">
        Em desenvolvimento
      </div>
    </div>
  );
};

export default ChartPlaceholder;
