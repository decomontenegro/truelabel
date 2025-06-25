// Certification types
export interface Certification {
  id: string;
  name: string;
  description?: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
  type: CertificationType;
  status: CertificationStatus;
  verificationMethod?: VerificationMethod;
  verificationUrl?: string;
  scope?: string;
  standards?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCertification {
  id: string;
  productId: string;
  certificationId: string;
  certification: Certification;
  status: CertificationStatus;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  verifiedAt?: string;
  verifiedBy?: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CertificationType = 
  | 'ISO'
  | 'HACCP'
  | 'ORGANIC'
  | 'FAIRTRADE'
  | 'KOSHER'
  | 'HALAL'
  | 'VEGAN'
  | 'NON_GMO'
  | 'GLUTEN_FREE'
  | 'RAINFOREST_ALLIANCE'
  | 'BRC'
  | 'IFS'
  | 'OTHER';

export type CertificationStatus = 
  | 'ACTIVE'
  | 'EXPIRED'
  | 'PENDING'
  | 'SUSPENDED'
  | 'REVOKED';

export type VerificationMethod = 
  | 'QR_CODE'
  | 'CERTIFICATE_NUMBER'
  | 'WEBSITE'
  | 'API'
  | 'MANUAL';

export interface CertificationBadge {
  id: string;
  certificationId: string;
  name: string;
  imageUrl: string;
  format: 'PNG' | 'SVG' | 'JPG';
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  backgroundColor?: string;
  textColor?: string;
  style: BadgeStyle;
  createdAt: string;
}

export type BadgeStyle = 
  | 'ROUND'
  | 'SQUARE'
  | 'SHIELD'
  | 'BANNER'
  | 'RIBBON';

export interface CertificationAlert {
  id: string;
  productId: string;
  certificationId: string;
  type: AlertType;
  message: string;
  daysBeforeExpiry?: number;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
}

export type AlertType = 
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'RENEWAL_REQUIRED'
  | 'VERIFICATION_FAILED'
  | 'DOCUMENT_MISSING';

export interface CertificationFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: CertificationType;
  status?: CertificationStatus;
  issuerId?: string;
  expiringWithinDays?: number;
  productId?: string;
}

export interface CreateCertificationData {
  name: string;
  description?: string;
  issuer: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  type: CertificationType;
  documentUrl?: string;
  verificationMethod?: VerificationMethod;
  verificationUrl?: string;
  scope?: string;
  standards?: string[];
}

export interface AddProductCertificationData {
  productId: string;
  certificationId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
  notes?: string;
}

export interface CertificationVerificationResult {
  isValid: boolean;
  status: CertificationStatus;
  verifiedAt: string;
  details?: {
    issuer?: string;
    expiryDate?: string;
    scope?: string;
    message?: string;
  };
  errors?: string[];
}

export interface CertificationStatistics {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number;
  byType: Record<CertificationType, number>;
  byIssuer: Record<string, number>;
  upcomingExpirations: Array<{
    certification: Certification;
    daysUntilExpiry: number;
  }>;
}

export interface CertificationTimeline {
  certificationId: string;
  events: Array<{
    id: string;
    type: 'ISSUED' | 'RENEWED' | 'VERIFIED' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
    date: string;
    description: string;
    performedBy?: string;
    documentUrl?: string;
  }>;
}

// Badge generation options
export interface BadgeGenerationOptions {
  certificationId: string;
  style: BadgeStyle;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  includeExpiry?: boolean;
  includeQR?: boolean;
  customText?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Bulk operations
export interface BulkCertificationUpload {
  file: File;
  mapping: {
    productIdColumn: string;
    certificationNameColumn: string;
    certificateNumberColumn: string;
    issueDateColumn: string;
    expiryDateColumn: string;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Certification information mapping
export const CERTIFICATION_INFO: Record<CertificationType, {
  name: string;
  color: string;
  description: string;
  icon: string;
  abbreviation: string;
  borderColor: string;
  bgColor: string;
}> = {
  ISO: { 
    name: 'ISO', 
    color: 'text-blue-600', 
    description: 'International Organization for Standardization',
    icon: '🏆',
    abbreviation: 'ISO',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50'
  },
  HACCP: { 
    name: 'HACCP', 
    color: 'text-green-600', 
    description: 'Hazard Analysis Critical Control Points',
    icon: '✓',
    abbreviation: 'HACCP',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  ORGANIC: { 
    name: 'Orgânico', 
    color: 'text-green-600', 
    description: 'Certificação de produto orgânico',
    icon: '🌱',
    abbreviation: 'ORG',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  FAIRTRADE: { 
    name: 'Fair Trade', 
    color: 'text-orange-600', 
    description: 'Comércio justo',
    icon: '🤝',
    abbreviation: 'FT',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50'
  },
  KOSHER: { 
    name: 'Kosher', 
    color: 'text-purple-600', 
    description: 'Certificação Kosher',
    icon: '✡️',
    abbreviation: 'K',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50'
  },
  HALAL: { 
    name: 'Halal', 
    color: 'text-green-600', 
    description: 'Certificação Halal',
    icon: '☪️',
    abbreviation: 'H',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  VEGAN: { 
    name: 'Vegano', 
    color: 'text-green-600', 
    description: 'Produto vegano',
    icon: '🌿',
    abbreviation: 'V',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  NON_GMO: { 
    name: 'Não-OGM', 
    color: 'text-green-600', 
    description: 'Livre de organismos geneticamente modificados',
    icon: '🚫',
    abbreviation: 'GMO',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  GLUTEN_FREE: { 
    name: 'Sem Glúten', 
    color: 'text-yellow-600', 
    description: 'Livre de glúten',
    icon: '🌾',
    abbreviation: 'GF',
    borderColor: 'border-yellow-300',
    bgColor: 'bg-yellow-50'
  },
  RAINFOREST_ALLIANCE: { 
    name: 'Rainforest Alliance', 
    color: 'text-green-600', 
    description: 'Certificação Rainforest Alliance',
    icon: '🐸',
    abbreviation: 'RA',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50'
  },
  BRC: { 
    name: 'BRC', 
    color: 'text-red-600', 
    description: 'British Retail Consortium',
    icon: '🏛️',
    abbreviation: 'BRC',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50'
  },
  IFS: { 
    name: 'IFS', 
    color: 'text-blue-600', 
    description: 'International Featured Standards',
    icon: '📋',
    abbreviation: 'IFS',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50'
  },
  OTHER: { 
    name: 'Outra', 
    color: 'text-gray-600', 
    description: 'Outra certificação',
    icon: '📄',
    abbreviation: 'OTHER',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-50'
  }
};