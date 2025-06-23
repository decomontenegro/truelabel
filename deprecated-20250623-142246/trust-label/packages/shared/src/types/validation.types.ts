export enum ValidationStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VALIDATED = 'VALIDATED',
  VALIDATED_WITH_REMARKS = 'VALIDATED_WITH_REMARKS',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum ClaimValidationStatus {
  VALIDATED = 'VALIDATED',
  VALIDATED_WITH_REMARKS = 'VALIDATED_WITH_REMARKS',
  NOT_VALIDATED = 'NOT_VALIDATED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface Validation {
  id: string;
  productId: string;
  laboratoryId: string;
  reportNumber: string;
  reportUrl: string;
  status: ValidationStatus;
  validFrom: Date;
  validUntil: Date;
  metadata?: Record<string, any>;
  aiAnalysis?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationClaim {
  id: string;
  validationId: string;
  claimId: string;
  status: ClaimValidationStatus;
  actualValue?: string;
  remarks?: string;
  confidence: number;
  methodology?: string;
  createdAt: Date;
}

export interface Laboratory {
  id: string;
  userId: string;
  name: string;
  cnpj: string;
  accreditation: string[];
  certifications: string[];
  specialties: string[];
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateValidationRequest {
  productId: string;
  laboratoryId?: string;
  reportNumber: string;
  reportUrl: string;
  validFrom: string;
  validUntil: string;
  metadata?: Record<string, any>;
}

export interface UpdateValidationRequest extends Partial<CreateValidationRequest> {
  status?: ValidationStatus;
  aiAnalysis?: Record<string, any>;
}

export interface UpdateClaimStatusRequest {
  status: ClaimValidationStatus;
  actualValue?: string;
  remarks?: string;
  confidence: number;
  methodology?: string;
}