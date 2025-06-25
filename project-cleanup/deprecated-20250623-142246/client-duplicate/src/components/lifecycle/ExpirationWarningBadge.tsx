import React from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

interface ExpirationWarningBadgeProps {
  expiryDate: Date;
  type?: 'validation' | 'certification' | 'qr';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ExpirationWarningBadge: React.FC<ExpirationWarningBadgeProps> = ({
  expiryDate,
  type = 'validation',
  showIcon = true,
  size = 'md'
}) => {
  const isExpired = isPast(expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine severity
  let severity: 'expired' | 'critical' | 'warning' | 'info';
  if (isExpired) {
    severity = 'expired';
  } else if (daysUntilExpiry <= 7) {
    severity = 'critical';
  } else if (daysUntilExpiry <= 30) {
    severity = 'warning';
  } else {
    severity = 'info';
  }

  // Style configuration
  const styles = {
    expired: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: XCircle
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle
    },
    warning: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: AlertTriangle
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Clock
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const style = styles[severity];
  const Icon = style.icon;

  // Format message
  let message: string;
  if (isExpired) {
    message = `Expired ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  } else {
    message = `Expires in ${formatDistanceToNow(expiryDate)}`;
  }

  // Add type prefix
  const typeLabels = {
    validation: 'Validation',
    certification: 'Certificate',
    qr: 'QR Code'
  };
  const fullMessage = `${typeLabels[type]} ${message.toLowerCase()}`;

  return (
    <div className={`
      inline-flex items-center gap-1.5 
      ${sizeClasses[size]} 
      ${style.bg} ${style.text} 
      border ${style.border} 
      rounded-full font-medium
    `}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{fullMessage}</span>
    </div>
  );
};