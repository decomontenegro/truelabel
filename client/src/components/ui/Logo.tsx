import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white' | 'blue' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  size = 'md',
  iconOnly = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: iconOnly ? 'w-6 h-6' : 'w-20 h-8',
    md: iconOnly ? 'w-8 h-8' : 'w-32 h-12',
    lg: iconOnly ? 'w-12 h-12' : 'w-48 h-18',
    xl: iconOnly ? 'w-16 h-16' : 'w-64 h-24'
  };

  const colorClasses = {
    default: 'text-black dark:text-white',
    white: 'text-white',
    blue: 'text-primary-600',
    auto: 'text-black dark:text-white'
  };

  if (iconOnly) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 64 64" className={`w-full h-full ${colorClasses[variant]}`} fill="currentColor">
          <rect x="28" y="12" width="8" height="40" rx="4"/>
          <rect x="18" y="18" width="28" height="8" rx="4"/>
          <path d="M28 52 Q28 58 34 58 L38 58 Q44 58 44 52" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 200 80" className={`w-full h-full ${colorClasses[variant]}`} fill="currentColor">
        <defs>
          <style>
            {`.logo-text { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; }`}
          </style>
        </defs>

        {/* "t" Icon */}
        <g>
          <rect x="15" y="15" width="8" height="50" rx="4"/>
          <rect x="8" y="20" width="22" height="8" rx="4"/>
          <path d="M15 65 Q15 70 20 70 L25 70 Q30 70 30 65" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </g>

        {/* "true label" text */}
        <text x="50" y="35" className="logo-text" fontSize="16" fontWeight="400" fill="currentColor">true</text>
        <text x="50" y="55" className="logo-text" fontSize="16" fontWeight="400" fill="currentColor">label</text>
      </svg>
    </div>
  );
};

export default Logo;
