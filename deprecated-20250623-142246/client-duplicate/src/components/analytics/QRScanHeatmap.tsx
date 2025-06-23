import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Maximize2, X, Info } from 'lucide-react';
import { GeoHeatmapData } from '@/types/analytics';
import { formatNumber } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface QRScanHeatmapProps {
  data: GeoHeatmapData[];
  loading?: boolean;
  height?: number;
  onLocationClick?: (location: GeoHeatmapData) => void;
}

const QRScanHeatmap: React.FC<QRScanHeatmapProps> = ({
  data,
  loading = false,
  height = 400,
  onLocationClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeoHeatmapData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<GeoHeatmapData | null>(null);

  // Simple map rendering using Canvas API
  useEffect(() => {
    if (!canvasRef.current || loading || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Find min/max values for normalization
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // Draw heat points
    data.forEach(point => {
      // Convert lat/lng to canvas coordinates (simplified projection)
      const x = ((point.location.lng + 180) / 360) * canvas.width;
      const y = ((90 - point.location.lat) / 180) * canvas.height;

      // Calculate radius and opacity based on value
      const normalizedValue = (point.value - minValue) / (maxValue - minValue);
      const radius = 20 + normalizedValue * 30;
      const opacity = 0.3 + normalizedValue * 0.7;

      // Draw gradient circle
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(249, 115, 22, ${opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(251, 191, 36, ${opacity * 0.3})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw location marker
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw location labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#4b5563';
    data.forEach(point => {
      const x = ((point.location.lng + 180) / 360) * canvas.width;
      const y = ((90 - point.location.lat) / 180) * canvas.height;
      
      ctx.fillText(point.location.city, x + 5, y - 5);
    });
  }, [data, loading, height]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked location
    const clickedLocation = data.find(point => {
      const px = ((point.location.lng + 180) / 360) * canvasRef.current!.width;
      const py = ((90 - point.location.lat) / 180) * canvasRef.current!.height;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      return distance < 30;
    });

    if (clickedLocation) {
      setSelectedLocation(clickedLocation);
      onLocationClick?.(clickedLocation);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find hovered location
    const hovered = data.find(point => {
      const px = ((point.location.lng + 180) / 360) * canvasRef.current!.width;
      const py = ((90 - point.location.lat) / 180) * canvasRef.current!.height;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      return distance < 30;
    });

    setHoveredLocation(hovered || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500" style={{ height }}>
        <MapPin className="h-12 w-12 mb-2 text-gray-400" />
        <p>Nenhum dado geográfico disponível</p>
      </div>
    );
  }

  const content = (
    <div className="relative bg-white rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={isFullscreen ? window.innerWidth - 100 : 800}
        height={isFullscreen ? window.innerHeight - 200 : height}
        className="cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredLocation(null)}
      />

      {/* Hover Tooltip */}
      {hoveredLocation && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="font-semibold text-gray-900">{hoveredLocation.location.city}</h4>
          {hoveredLocation.location.state && (
            <p className="text-sm text-gray-600">{hoveredLocation.location.state}</p>
          )}
          <p className="text-sm text-gray-600">{hoveredLocation.location.country}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-600">Escaneamentos:</span>{' '}
              <span className="font-medium">{formatNumber(hoveredLocation.value)}</span>
            </p>
            {hoveredLocation.details && (
              <>
                <p className="text-sm">
                  <span className="text-gray-600">Usuários únicos:</span>{' '}
                  <span className="font-medium">{formatNumber(hoveredLocation.details.uniqueUsers)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Tempo médio:</span>{' '}
                  <span className="font-medium">{hoveredLocation.details.avgSessionDuration}s</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Intensidade</h4>
        <div className="flex items-center space-x-2">
          <div className="w-20 h-4 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded" />
          <div className="flex justify-between w-20 text-xs text-gray-600">
            <span>Baixa</span>
            <span>Alta</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Toggle */}
      {!isFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Tela cheia"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Mapa de Calor - Escaneamentos QR</h3>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default QRScanHeatmap;