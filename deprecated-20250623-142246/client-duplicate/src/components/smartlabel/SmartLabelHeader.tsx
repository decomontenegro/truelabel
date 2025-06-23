import React from 'react';
import { 
  Shield, 
  CheckCircle, 
  Share2, 
  Printer,
  ChevronLeft,
  Calendar,
  Building,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SmartLabelData } from '@/services/smartLabelService';
import { formatDate } from '@/lib/utils';

interface SmartLabelHeaderProps {
  product: SmartLabelData;
  onShare: () => void;
  onPrint: () => void;
}

export default function SmartLabelHeader({ product, onShare, onPrint }: SmartLabelHeaderProps) {
  const isValidated = product.status === 'VALIDATED';
  const hasImage = !!product.imageUrl;

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      {/* Top Navigation */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <Shield className="h-6 w-6" />
              <span className="font-semibold">True Label</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onShare}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Compartilhar produto"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
              
              <button
                onClick={onPrint}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Imprimir informações"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <div className="relative mx-auto lg:mx-0 w-64 h-64 lg:w-full lg:h-80">
              {hasImage ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-full bg-white/10 rounded-xl shadow-2xl flex items-center justify-center">
                  <div className="text-white/50">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5V7.5c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85 17.96 7.5 12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zm14 0v-6.7l-6 3.37v6.71l6-3.38z"/>
                    </svg>
                  </div>
                </div>
              )}
              
              {isValidated && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-3 rounded-full shadow-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <div className="space-y-4">
              {/* Brand */}
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Building className="h-5 w-5 opacity-70" />
                <span className="text-xl opacity-90">{product.brand}</span>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl lg:text-5xl font-bold">{product.name}</h1>

              {/* Category & SKU */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm">
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  {product.category}
                </span>
                <span className="opacity-70">SKU: {product.sku}</span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-lg opacity-90 max-w-2xl">
                  {product.description}
                </p>
              )}

              {/* Validation Status */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                {isValidated ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="font-semibold">Produto Validado</p>
                      <p className="text-sm opacity-80">
                        Por laboratório acreditado
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-yellow-400" />
                    <div>
                      <p className="font-semibold">Validação Pendente</p>
                      <p className="text-sm opacity-80">
                        Em processo de verificação
                      </p>
                    </div>
                  </div>
                )}

                {product.certifications && product.certifications.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Award className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="font-semibold">{product.certifications.length} Certificações</p>
                      <p className="text-sm opacity-80">
                        Verificadas e ativas
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 opacity-70" />
                  <div>
                    <p className="text-sm opacity-80">Atualizado em</p>
                    <p className="font-semibold">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Nutritional Highlights */}
              {product.nutritionalHighlights && product.nutritionalHighlights.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-4">
                  {product.nutritionalHighlights.map((highlight, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-full"
                    >
                      <span className="text-2xl">{highlight.icon}</span>
                      <span className="font-medium">{highlight.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}