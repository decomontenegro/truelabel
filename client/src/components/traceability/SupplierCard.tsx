import React from 'react';
import { Building2, MapPin, Phone, Mail, Award, CheckCircle, Star, Leaf, Calendar } from 'lucide-react';
import { Supplier } from '@/types/traceability';
import { format } from 'date-fns';

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: (supplier: Supplier) => void;
  showDetails?: boolean;
}

const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onClick,
  showDetails = true
}) => {
  const getSupplierTypeIcon = (type: Supplier['type']) => {
    switch (type) {
      case 'FARMER':
        return <Leaf className="w-5 h-5" />;
      case 'PROCESSOR':
      case 'MANUFACTURER':
        return <Building2 className="w-5 h-5" />;
      case 'DISTRIBUTOR':
      case 'RETAILER':
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  const getSupplierTypeColor = (type: Supplier['type']) => {
    switch (type) {
      case 'FARMER':
        return 'bg-green-100 text-green-700';
      case 'PROCESSOR':
        return 'bg-blue-100 text-blue-700';
      case 'MANUFACTURER':
        return 'bg-purple-100 text-purple-700';
      case 'DISTRIBUTOR':
        return 'bg-orange-100 text-orange-700';
      case 'RETAILER':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
      }`}
      onClick={() => onClick?.(supplier)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getSupplierTypeColor(supplier.type)}`}>
            {getSupplierTypeIcon(supplier.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {supplier.name}
              {supplier.verified && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{supplier.type.toLowerCase()}</p>
          </div>
        </div>
        
        {supplier.sustainabilityScore && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <Leaf className="w-4 h-4" />
              <span className="font-semibold">{supplier.sustainabilityScore}%</span>
            </div>
            <p className="text-xs text-gray-500">Sustainability</p>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 mb-3">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="text-sm">
          <p className="text-gray-700">
            {supplier.region ? `${supplier.region}, ` : ''}{supplier.country}
          </p>
          {supplier.address && (
            <p className="text-gray-500">{supplier.address}</p>
          )}
        </div>
      </div>

      {/* Rating */}
      {supplier.rating && (
        <div className="mb-3">
          {renderRating(supplier.rating)}
        </div>
      )}

      {/* Contact Info */}
      {showDetails && supplier.contact && (
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{supplier.contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{supplier.contact.phone}</span>
          </div>
        </div>
      )}

      {/* Certifications */}
      {supplier.certifications && supplier.certifications.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Certifications</h4>
          <div className="flex flex-wrap gap-2">
            {supplier.certifications.slice(0, 3).map((cert, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
              >
                <Award className="w-3 h-3" />
                <span>{cert.name}</span>
              </div>
            ))}
            {supplier.certifications.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{supplier.certifications.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Partner since {format(new Date(supplier.since), 'yyyy')}</span>
        </div>
        
        {supplier.fairTradeVerified && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Fair Trade</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierCard;