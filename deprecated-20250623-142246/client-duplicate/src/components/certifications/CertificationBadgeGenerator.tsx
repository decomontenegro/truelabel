import React, { useState, useRef } from 'react';
import { Award, Download, Palette, Square, Circle, Shield, Flag, Loader } from 'lucide-react';
import { BadgeGenerationOptions, CertificationBadge, BadgeStyle } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import toast from 'react-hot-toast';

interface CertificationBadgeGeneratorProps {
  certificationId: string;
  certificationName: string;
  onBadgeGenerated?: (badge: CertificationBadge) => void;
}

const CertificationBadgeGenerator: React.FC<CertificationBadgeGeneratorProps> = ({
  certificationId,
  certificationName,
  onBadgeGenerated
}) => {
  const [options, setOptions] = useState<BadgeGenerationOptions>({
    certificationId,
    style: 'ROUND',
    size: 'MEDIUM',
    includeExpiry: false,
    includeQR: false,
    customText: '',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF'
  });
  
  const [generatedBadge, setGeneratedBadge] = useState<CertificationBadge | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { execute: generateBadge, loading } = useAsyncAction(async () => {
    const response = await certificationService.generateBadge(options);
    setGeneratedBadge(response.badge);
    setPreviewUrl(response.badge.imageUrl);
    onBadgeGenerated?.(response.badge);
    toast.success('Badge gerado com sucesso!');
  });

  const badgeStyles: Array<{ value: BadgeStyle; label: string; icon: React.FC<any> }> = [
    { value: 'ROUND', label: 'Redondo', icon: Circle },
    { value: 'SQUARE', label: 'Quadrado', icon: Square },
    { value: 'SHIELD', label: 'Escudo', icon: Shield },
    { value: 'BANNER', label: 'Banner', icon: Flag },
    { value: 'RIBBON', label: 'Fita', icon: Award }
  ];

  const sizes = [
    { value: 'SMALL', label: 'Pequeno (100x100)' },
    { value: 'MEDIUM', label: 'Médio (200x200)' },
    { value: 'LARGE', label: 'Grande (400x400)' }
  ];

  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#6B7280', // Gray
    '#000000', // Black
  ];

  const downloadBadge = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `badge-${certificationId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const updatePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on selected size
    const sizeMap = {
      SMALL: 100,
      MEDIUM: 200,
      LARGE: 400
    };
    const size = sizeMap[options.size];
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background shape
    ctx.fillStyle = options.backgroundColor || '#3B82F6';
    
    switch (options.style) {
      case 'ROUND':
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case 'SQUARE':
        ctx.fillRect(0, 0, size, size);
        break;
      
      case 'SHIELD':
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size, size * 0.3);
        ctx.lineTo(size, size * 0.7);
        ctx.lineTo(size / 2, size);
        ctx.lineTo(0, size * 0.7);
        ctx.lineTo(0, size * 0.3);
        ctx.closePath();
        ctx.fill();
        break;
      
      case 'BANNER':
        ctx.fillRect(0, size * 0.2, size, size * 0.6);
        break;
      
      case 'RIBBON':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.lineTo(size * 0.85, size / 2);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.lineTo(size * 0.15, size / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Draw text
    ctx.fillStyle = options.textColor || '#FFFFFF';
    ctx.font = `bold ${size / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = options.customText || certificationName;
    const maxWidth = size * 0.8;
    
    // Word wrap if needed
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    const lineHeight = size / 6;
    const startY = size / 2 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, size / 2, startY + index * lineHeight);
    });

    // Convert canvas to data URL
    setPreviewUrl(canvas.toDataURL('image/png'));
  };

  React.useEffect(() => {
    updatePreview();
  }, [options, certificationName]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Award className="w-6 h-6 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Gerador de Badge
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Options */}
        <div className="space-y-4">
          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estilo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {badgeStyles.map(style => {
                const Icon = style.icon;
                return (
                  <button
                    key={style.value}
                    onClick={() => setOptions({ ...options, style: style.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      options.style === style.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${
                      options.style === style.value ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                    <p className="text-xs text-gray-700">{style.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho
            </label>
            <select
              value={options.size}
              onChange={(e) => setOptions({ ...options, size: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {sizes.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor de Fundo
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={options.backgroundColor}
                onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                className="h-10 w-20"
              />
              <div className="flex space-x-1">
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setOptions({ ...options, backgroundColor: color })}
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Texto
            </label>
            <input
              type="color"
              value={options.textColor}
              onChange={(e) => setOptions({ ...options, textColor: e.target.value })}
              className="h-10 w-20"
            />
          </div>

          {/* Custom Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto Personalizado (opcional)
            </label>
            <input
              type="text"
              value={options.customText}
              onChange={(e) => setOptions({ ...options, customText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={certificationName}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeExpiry}
                onChange={(e) => setOptions({ ...options, includeExpiry: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Incluir data de expiração
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeQR}
                onChange={(e) => setOptions({ ...options, includeQR: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Incluir QR Code de verificação
              </span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">
              Pré-visualização
            </h4>
            
            <div className="flex items-center justify-center mb-4">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            
            {previewUrl && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-4">
                  Clique no botão abaixo para gerar o badge final
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
        <button
          onClick={generateBadge}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Award className="w-4 h-4 mr-2" />
              Gerar Badge
            </>
          )}
        </button>
        
        {generatedBadge && (
          <button
            onClick={downloadBadge}
            className="btn btn-outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Badge
          </button>
        )}
      </div>
    </div>
  );
};

export default CertificationBadgeGenerator;