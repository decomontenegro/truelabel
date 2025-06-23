import React, { useState, useEffect } from 'react';
import { Certification, CERTIFICATION_INFO } from '@/types/certifications';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificationValidatorProps {
  certification: Certification;
  onValidation?: (validation: CertificationValidation) => void;
  autoValidate?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const CertificationValidator: React.FC<CertificationValidatorProps> = ({
  certification,
  onValidation,
  autoValidate = true,
  showDetails = true,
  className
}) => {
  const [validation, setValidation] = useState<CertificationValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const info = CERTIFICATION_INFO[certification.type];

  const validateCertification = async () => {
    setIsValidating(true);
    
    try {
      // Simulated validation logic - in real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const today = new Date();
      const expiryDate = new Date(certification.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = certification.status;
      let isValid = false;
      let message = '';
      
      // Check if expired
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
        isValid = false;
        message = `Certificação expirada há ${Math.abs(daysUntilExpiry)} dias`;
      } 
      // Check if suspended or revoked
      else if (status === 'SUSPENDED') {
        isValid = false;
        message = 'Certificação suspensa pelo órgão emissor';
      } else if (status === 'REVOKED') {
        isValid = false;
        message = 'Certificação revogada pelo órgão emissor';
      }
      // Check if pending
      else if (status === 'PENDING') {
        isValid = false;
        message = 'Certificação pendente de aprovação';
      }
      // Check if in renewal
      else if (status === 'PENDING') {
        isValid = true;
        message = 'Certificação em processo de renovação';
      }
      // Check if expiring soon
      else if (daysUntilExpiry <= 30) {
        isValid = true;
        message = `Certificação válida, mas expira em ${daysUntilExpiry} dias`;
      }
      // Valid
      else {
        isValid = true;
        message = 'Certificação válida e em conformidade';
      }
      
      const validationResult: CertificationValidation = {
        isValid,
        status,
        message,
        expiresIn: daysUntilExpiry > 0 ? daysUntilExpiry : undefined,
        lastVerified: new Date().toISOString(),
        nextVerification: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next day
      };
      
      setValidation(validationResult);
      setLastValidated(new Date());
      
      if (onValidation) {
        onValidation(validationResult);
      }
    } catch (error) {
      const errorValidation: CertificationValidation = {
        isValid: false,
        status: certification.status,
        message: 'Erro ao validar certificação',
        lastVerified: new Date().toISOString()
      };
      
      setValidation(errorValidation);
      
      if (onValidation) {
        onValidation(errorValidation);
      }
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (autoValidate && !validation) {
      validateCertification();
    }
  }, [certification, autoValidate]);

  const getValidationIcon = () => {
    if (isValidating) {
      return <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />;
    }
    
    if (!validation) {
      return null;
    }
    
    if (validation.isValid) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else {
      if (validation.status === 'EXPIRED' || 
          validation.status === 'REVOKED') {
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      } else {
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      }
    }
  };

  const getValidationColor = () => {
    if (!validation) return 'border-gray-200 bg-gray-50';
    
    if (validation.isValid) {
      if (validation.expiresIn && validation.expiresIn <= 30) {
        return 'border-yellow-200 bg-yellow-50';
      }
      return 'border-green-200 bg-green-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  const getValidationTextColor = () => {
    if (!validation) return 'text-gray-600';
    
    if (validation.isValid) {
      if (validation.expiresIn && validation.expiresIn <= 30) {
        return 'text-yellow-800';
      }
      return 'text-green-800';
    } else {
      return 'text-red-800';
    }
  };

  return (
    <div className={cn('rounded-lg border p-4', getValidationColor(), className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getValidationIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label={info.name}>
                {info.icon}
              </span>
              <p className={cn('text-sm font-medium', getValidationTextColor())}>
                {info.abbreviation} - {certification.registrationNumber}
              </p>
            </div>
            
            {validation && (
              <p className={cn('mt-1 text-sm', getValidationTextColor())}>
                {validation.message}
              </p>
            )}
            
            {showDetails && validation && (
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                {validation.expiresIn !== undefined && validation.expiresIn > 0 && (
                  <p>
                    Validade: {format(new Date(certification.expiryDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
                {lastValidated && (
                  <p>
                    Última verificação: {format(lastValidated, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {info.verificationUrl && (
                  <a
                    href={info.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Verificar no site oficial →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!autoValidate && (
          <button
            onClick={validateCertification}
            disabled={isValidating}
            className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                Validando...
              </>
            ) : (
              'Validar'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

interface CertificationValidatorListProps {
  certifications: Certification[];
  onValidation?: (certificationId: string, validation: CertificationValidation) => void;
  autoValidate?: boolean;
  className?: string;
}

export const CertificationValidatorList: React.FC<CertificationValidatorListProps> = ({
  certifications,
  onValidation,
  autoValidate = true,
  className
}) => {
  const [validations, setValidations] = useState<Record<string>>({});

  const handleValidation = (certificationId: string) => (validation: CertificationValidation) => {
    setValidations(prev => ({
      ...prev,
      [certificationId]: validation
    }));
    
    if (onValidation) {
      onValidation(certificationId, validation);
    }
  };

  const allValid = Object.values(validations).every(v => v.isValid);
  const validCount = Object.values(validations).filter(v => v.isValid).length;
  const totalCount = certifications.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Certificações do Produto</h3>
        <div className="flex items-center gap-2">
          {Object.keys(validations).length === totalCount && (
            <span className={cn(
              'text-sm font-medium',
              allValid ? 'text-green-600' : 'text-yellow-600'
            )}>
              {validCount}/{totalCount} válidas
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {certifications.map((cert) => (
          <CertificationValidator
            key={cert.id}
            certification={cert}
            onValidation={handleValidation(cert.id)}
            autoValidate={autoValidate}
            showDetails={true}
          />
        ))}
      </div>
      
      {certifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma certificação encontrada para este produto.</p>
        </div>
      )}
    </div>
  );
};