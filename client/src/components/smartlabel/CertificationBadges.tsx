import React, { useState } from 'react';
import { 
  Award, 
  Shield, 
  CheckCircle, 
  ExternalLink,
  Calendar,
  Building,
  FileText,
  Info,
  Download
} from 'lucide-react';
import { Certification, Seal } from '@/types';
import { formatDate } from '@/lib/utils';

interface CertificationBadgesProps {
  certifications?: Certification[];
  seals?: Seal[];
}

export default function CertificationBadges({ certifications = [], seals = [] }: CertificationBadgesProps) {
  const [selectedCert, setSelectedCert] = useState<Certification | Seal | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  // Combine certifications and seals
  const allCertifications = [
    ...certifications.map(cert => ({ ...cert, type: 'certification' as const })),
    ...seals.map(seal => ({ 
      ...seal, 
      type: 'seal' as const,
      issuer: seal.issuer || 'True Label',
      expiryDate: seal.validUntil
    }))
  ];

  // Filter active/expired
  const activeCerts = allCertifications.filter(cert => {
    if (!cert.expiryDate) return true;
    return new Date(cert.expiryDate) > new Date();
  });

  const expiredCerts = allCertifications.filter(cert => {
    if (!cert.expiryDate) return false;
    return new Date(cert.expiryDate) <= new Date();
  });

  const displayCerts = showExpired ? [...activeCerts, ...expiredCerts] : activeCerts;

  // Get certification icon based on type
  const getCertIcon = (cert: any): string => {
    const name = cert.name.toLowerCase();
    if (name.includes('organic') || name.includes('orgânico')) return '🌱';
    if (name.includes('iso')) return '🏆';
    if (name.includes('haccp') || name.includes('appcc')) return '✅';
    if (name.includes('fair') || name.includes('justo')) return '🤝';
    if (name.includes('sustent') || name.includes('eco')) return '🌍';
    if (name.includes('kosher')) return '✡️';
    if (name.includes('halal')) return '☪️';
    if (name.includes('vegan')) return '🌿';
    if (name.includes('gluten')) return '🌾';
    if (name.includes('non-gmo') || name.includes('transgên')) return '🚫';
    return '📋';
  };

  // Get certification color based on type
  const getCertColor = (cert: any): string => {
    const name = cert.name.toLowerCase();
    if (name.includes('organic') || name.includes('orgânico')) return 'green';
    if (name.includes('iso')) return 'blue';
    if (name.includes('sustent') || name.includes('eco')) return 'emerald';
    if (name.includes('fair') || name.includes('justo')) return 'purple';
    return 'gray';
  };

  const isExpired = (date?: string): boolean => {
    if (!date) return false;
    return new Date(date) <= new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Certificações e Selos</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeCerts.length} certificações ativas
              {expiredCerts.length > 0 && ` • ${expiredCerts.length} expiradas`}
            </p>
          </div>
          {expiredCerts.length > 0 && (
            <button
              onClick={() => setShowExpired(!showExpired)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showExpired ? 'Ocultar' : 'Mostrar'} expiradas
            </button>
          )}
        </div>
      </div>

      {/* Certifications Grid */}
      <div className="p-6">
        {displayCerts.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma certificação registrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCerts.map((cert, index) => {
              const expired = isExpired(cert.expiryDate);
              const color = getCertColor(cert);
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedCert(cert)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all hover:shadow-lg
                    ${expired 
                      ? 'opacity-50 border-gray-300 bg-gray-50' 
                      : `border-${color}-200 bg-${color}-50 hover:border-${color}-400`
                    }
                  `}
                >
                  {/* Expired Badge */}
                  {expired && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Expirada
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-4xl mb-3">{getCertIcon(cert)}</div>

                  {/* Name */}
                  <h3 className={`font-semibold text-sm ${expired ? 'text-gray-600' : 'text-gray-900'}`}>
                    {cert.name}
                  </h3>

                  {/* Issuer */}
                  <p className="text-xs text-gray-600 mt-1">{cert.issuer}</p>

                  {/* Type Badge */}
                  <div className="mt-3">
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${cert.type === 'seal' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                      }
                    `}>
                      {cert.type === 'seal' ? (
                        <>
                          <Award className="h-3 w-3 mr-1" />
                          Selo
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Certificação
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Trust Statement */}
        <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary-900">
                Todas as certificações são verificadas
              </p>
              <p className="text-xs text-primary-700 mt-1">
                As certificações e selos exibidos foram validados pela plataforma True Label 
                junto aos órgãos emissores competentes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Certification Details Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes da {selectedCert.type === 'seal' ? 'Selo' : 'Certificação'}
                </h3>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Icon and Name */}
              <div className="text-center">
                <div className="text-6xl mb-4">{getCertIcon(selectedCert)}</div>
                <h4 className="text-xl font-bold text-gray-900">{selectedCert.name}</h4>
                {selectedCert.description && (
                  <p className="text-gray-600 mt-2">{selectedCert.description}</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    Emissor
                  </span>
                  <span className="text-sm font-medium text-gray-900">{selectedCert.issuer}</span>
                </div>

                {(selectedCert as Certification).number && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      Número
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {(selectedCert as Certification).number}
                    </span>
                  </div>
                )}

                {(selectedCert as Certification).issueDate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Data de Emissão
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate((selectedCert as Certification).issueDate)}
                    </span>
                  </div>
                )}

                {selectedCert.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Validade
                    </span>
                    <span className={`text-sm font-medium ${
                      isExpired(selectedCert.expiryDate) ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDate(selectedCert.expiryDate)}
                      {isExpired(selectedCert.expiryDate) && ' (Expirada)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                {(selectedCert as Certification).documentUrl && (
                  <a
                    href={(selectedCert as Certification).documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Certificado</span>
                  </a>
                )}
                
                <button
                  onClick={() => setSelectedCert(null)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}