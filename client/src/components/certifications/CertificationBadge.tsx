import React from 'react';
import { Certification, CERTIFICATION_INFO } from '@/types/certifications';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface CertificationBadgeProps {
  certification: Certification;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certification,
  size = 'md',
  showStatus = true,
  onClick,
  className
}) => {
  const info = CERTIFICATION_INFO[certification.type];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatusIcon = () => {
    switch (certification.status) {
      case 'ACTIVE':
        return <CheckCircleIcon className={cn(iconSizeClasses[size], 'text-green-500')} />;
      case 'EXPIRED':
        return <XCircleIcon className={cn(iconSizeClasses[size], 'text-red-500')} />;
      case 'SUSPENDED':
      case 'REVOKED':
        return <ExclamationTriangleIcon className={cn(iconSizeClasses[size], 'text-red-500')} />;
      case 'PENDING':
        return <ClockIcon className={cn(iconSizeClasses[size], 'text-yellow-500')} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (certification.status) {
      case 'ACTIVE':
        return 'border-green-300 bg-green-50';
      case 'EXPIRED':
      case 'SUSPENDED':
      case 'REVOKED':
        return 'border-red-300 bg-red-50';
      case 'PENDING':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return info.borderColor + ' ' + info.bgColor;
    }
  };

  const isExpiringSoon = () => {
    if (certification.status !== 'ACTIVE' || !certification.expiryDate) {
      return false;
    }
    
    const expiryDate = new Date(certification.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 30;
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        sizeClasses[size],
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
        showStatus ? getStatusColor() : `${info.borderColor} ${info.bgColor}`,
        isExpiringSoon() && 'animate-pulse',
        className
      )}
      onClick={onClick}
      title={`${info.name} - ${certification.number}`}
    >
      <span className="text-lg" role="img" aria-label={info.name}>
        {info.icon}
      </span>
      <span className={cn('font-medium', info.color)}>
        {info.abbreviation}
      </span>
      {showStatus && getStatusIcon()}
    </div>
  );
};

interface CertificationBadgeGroupProps {
  certifications: Certification[];
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  onBadgeClick?: (certification: Certification) => void;
  maxDisplay?: number;
  className?: string;
}

export const CertificationBadgeGroup: React.FC<CertificationBadgeGroupProps> = ({
  certifications,
  size = 'sm',
  showStatus = false,
  onBadgeClick,
  maxDisplay = 5,
  className
}) => {
  const displayCertifications = certifications.slice(0, maxDisplay);
  const remainingCount = certifications.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayCertifications.map((cert) => (
        <CertificationBadge
          key={cert.id}
          certification={cert}
          size={size}
          showStatus={showStatus}
          onClick={onBadgeClick ? () => onBadgeClick(cert) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-gray-300 bg-gray-50',
            size === 'sm' ? 'px-2 py-1 text-xs' : size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'
          )}
        >
          <span className="text-gray-600 font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};