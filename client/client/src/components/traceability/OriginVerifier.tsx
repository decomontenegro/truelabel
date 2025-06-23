import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, AlertCircle, Shield, Globe, Camera, FileText, Link } from 'lucide-react';
import { OriginClaim, OriginEvidence } from '@/types/traceability';
import { format } from 'date-fns';

interface OriginVerifierProps {
  claims: OriginClaim[];
  onVerify?: (claimId: string, evidence: OriginEvidence[]) => void;
  onAddEvidence?: (claimId: string, evidence: OriginEvidence) => void;
}

const OriginVerifier: React.FC<OriginVerifierProps> = ({
  claims,
  onVerify,
  onAddEvidence
}) => {
  const [selectedClaim, setSelectedClaim] = useState<OriginClaim | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const getVerificationIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-gray-400" />
    );
  };

  const getClaimTypeIcon = (type: OriginClaim['claimType']) => {
    switch (type) {
      case 'COUNTRY':
        return <Globe className="w-4 h-4" />;
      case 'REGION':
      case 'FARM':
      case 'FACILITY':
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getVerificationMethodIcon = (method?: OriginClaim['verificationMethod']) => {
    switch (method) {
      case 'GPS':
        return <MapPin className="w-4 h-4" />;
      case 'BLOCKCHAIN':
        return <Link className="w-4 h-4" />;
      case 'CERTIFICATE':
        return <FileText className="w-4 h-4" />;
      case 'AUDIT':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEvidenceTypeIcon = (type: OriginEvidence['type']) => {
    switch (type) {
      case 'DOCUMENT':
        return <FileText className="w-4 h-4" />;
      case 'IMAGE':
        return <Camera className="w-4 h-4" />;
      case 'GPS_LOG':
        return <MapPin className="w-4 h-4" />;
      case 'BLOCKCHAIN_HASH':
        return <Link className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getClaimTypeLabel = (type: OriginClaim['claimType']) => {
    switch (type) {
      case 'COUNTRY':
        return 'Country of Origin';
      case 'REGION':
        return 'Regional Origin';
      case 'FARM':
        return 'Farm Origin';
      case 'FACILITY':
        return 'Processing Facility';
      default:
        return 'Origin';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Origin Claims & Verification</h3>
        
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedClaim?.id === claim.id
                  ? 'border-blue-500 bg-blue-50'
                  : claim.verified
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${claim.verified ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {getClaimTypeIcon(claim.claimType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{getClaimTypeLabel(claim.claimType)}</h4>
                      {getVerificationIcon(claim.verified)}
                    </div>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{claim.location}</p>
                    
                    {claim.coordinates && (
                      <p className="text-sm text-gray-500 mt-1">
                        Coordinates: {claim.coordinates.lat.toFixed(6)}, {claim.coordinates.lng.toFixed(6)}
                      </p>
                    )}
                    
                    {claim.verificationDate && (
                      <p className="text-sm text-gray-500 mt-2">
                        Verified on {format(new Date(claim.verificationDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {claim.verificationMethod && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200">
                    {getVerificationMethodIcon(claim.verificationMethod)}
                    <span className="text-sm font-medium text-gray-700">
                      {claim.verificationMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* Evidence Section */}
              {claim.evidence && claim.evidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Supporting Evidence</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {claim.evidence.map((evidence, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                      >
                        {getEvidenceTypeIcon(evidence.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {evidence.description || evidence.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(evidence.timestamp), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {evidence.url && (
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!claim.verified && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEvidenceModal(true);
                    }}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Add Evidence
                  </button>
                  {claim.evidence && claim.evidence.length > 0 && onVerify && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerify(claim.id, claim.evidence);
                      }}
                      className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    >
                      Verify Claim
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {claims.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No origin claims found</p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{claims.length}</div>
            <p className="text-xs text-gray-500">Total Claims</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {claims.filter(c => c.verified).length}
            </div>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {claims.filter(c => !c.verified).length}
            </div>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      {selectedClaim && selectedClaim.coordinates && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Location Map</h4>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p>Map integration for {selectedClaim.location}</p>
              <p className="text-sm mt-1">
                {selectedClaim.coordinates.lat.toFixed(4)}, {selectedClaim.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OriginVerifier;