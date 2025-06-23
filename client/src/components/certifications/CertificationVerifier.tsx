import React, { useState } from 'react';
import { Shield, Search, CheckCircle, XCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { Certification, CertificationVerificationResult } from '@/types/certifications';
import { certificationService } from '@/services/certificationService';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface CertificationVerifierProps {
  certification?: Certification;
  onVerificationComplete?: (result: CertificationVerificationResult) => void;
}

const CertificationVerifier: React.FC<CertificationVerifierProps> = ({ 
  certification, 
  onVerificationComplete 
}) => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<CertificationVerificationResult | null>(null);
  const [selectedCertificationId, setSelectedCertificationId] = useState(certification?.id || '');

  const { execute: verifyCertification, loading } = useAsyncAction(async () => {
    if (!selectedCertificationId && !certificateNumber) {
      return;
    }

    const result = await certificationService.verifyCertification(
      selectedCertificationId || '',
      certificateNumber || undefined
    );
    
    setVerificationResult(result);
    onVerificationComplete?.(result);
  });

  const getStatusIcon = () => {
    if (!verificationResult) return null;

    if (verificationResult.isValid) {
      return <CheckCircle className="w-16 h-16 text-green-600" />;
    } else {
      return <XCircle className="w-16 h-16 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    if (!verificationResult) return 'gray';
    return verificationResult.isValid ? 'green' : 'red';
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertification();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Verificador de Certificação
        </h3>
      </div>

      {!certification && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID da Certificação
          </label>
          <input
            type="text"
            value={selectedCertificationId}
            onChange={(e) => setSelectedCertificationId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Digite o ID da certificação"
          />
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número do Certificado
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: BR-12345/2024"
              required
            />
            <button
              type="submit"
              disabled={loading || (!selectedCertificationId && !certificateNumber)}
              className="btn btn-primary"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Verificar
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {verificationResult && (
        <div className={`mt-6 p-6 rounded-lg border-2 border-${getStatusColor()}-200 bg-${getStatusColor()}-50`}>
          <div className="flex flex-col items-center text-center">
            {getStatusIcon()}
            
            <h4 className={`text-xl font-semibold text-${getStatusColor()}-800 mt-4 mb-2`}>
              {verificationResult.isValid ? 'Certificação Válida' : 'Certificação Inválida'}
            </h4>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Status:</span>{' '}
                {certificationService.getCertificationStatusLabel(verificationResult.status)}
              </p>
              
              {verificationResult.details?.issuer && (
                <p>
                  <span className="font-medium">Emissor:</span>{' '}
                  {verificationResult.details.issuer}
                </p>
              )}
              
              {verificationResult.details?.expiryDate && (
                <p>
                  <span className="font-medium">Válido até:</span>{' '}
                  {new Date(verificationResult.details.expiryDate).toLocaleDateString('pt-BR')}
                </p>
              )}
              
              {verificationResult.details?.scope && (
                <p>
                  <span className="font-medium">Escopo:</span>{' '}
                  {verificationResult.details.scope}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-3">
                Verificado em: {new Date(verificationResult.verifiedAt).toLocaleString('pt-BR')}
              </p>
            </div>

            {verificationResult.details?.message && (
              <div className={`mt-4 p-3 rounded-lg bg-${getStatusColor()}-100`}>
                <p className={`text-sm text-${getStatusColor()}-700`}>
                  {verificationResult.details.message}
                </p>
              </div>
            )}

            {verificationResult.errors && verificationResult.errors.length > 0 && (
              <div className="mt-4 w-full">
                <p className="text-sm font-medium text-red-700 mb-2">Erros encontrados:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {verificationResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {certification?.verificationUrl && (
              <a
                href={certification.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                Verificar no site oficial
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            )}
          </div>
        </div>
      )}

      {!verificationResult && certification && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Informações da Certificação</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Nome:</span> {certification.name}</p>
            <p><span className="font-medium">Tipo:</span> {certificationService.getCertificationTypeLabel(certification.type)}</p>
            <p><span className="font-medium">Emissor:</span> {certification.issuer}</p>
            {certification.verificationMethod && (
              <p>
                <span className="font-medium">Método de Verificação:</span>{' '}
                {certification.verificationMethod}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationVerifier;