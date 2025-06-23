// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'BRAND' | 'LAB' | 'CONSUMER';
  company?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  sku: string;
  batchNumber?: string;
  batch?: string;
  barcode?: string;
  expiryDate?: string;
  manufacturer?: string;
  nutritionalInfo?: any;
  nutritionInfo?: any;
  claims: string; // Claims separados por vírgula
  imageUrl?: string;
  qrCode?: string;
  reportUrl?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  validations?: Validation[];
  reports?: Report[];
  laboratory?: Laboratory;
  seals?: Seal[];
  ingredients?: Ingredient[];
  allergens?: string[];
  certifications?: Certification[];
  traceability?: TraceabilityData;
  contact?: ContactInfo;
  enableSmartLabel?: boolean;
  smartLabelUrl?: string;
  _count?: {
    reports: number;
  };
}

export interface CreateProductData {
  name: string;
  brand: string;
  category: string;
  description?: string;
  sku: string;
  batchNumber?: string;
  nutritionalInfo?: any;
  claims: string; // Claims separados por vírgula
  imageUrl?: string;
  image?: File;
}

// Laboratory types
export interface Laboratory {
  id: string;
  name: string;
  accreditation: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  reports?: Report[];
  _count?: {
    reports: number;
  };
}

// Report types
export interface Report {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  analysisType: string;
  results: any;
  isVerified: boolean;
  verificationHash?: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  product?: {
    name: string;
    brand: string;
    sku: string;
  };
  laboratoryId: string;
  laboratory?: Laboratory;
  validations?: Validation[];
}

export interface CreateReportData {
  productId: string;
  laboratoryId: string;
  analysisType: string;
  results?: any;
  report: File;
}

// Validation types
export enum ValidationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIAL = 'PARTIAL',
  EXPIRED = 'EXPIRED',
  REVALIDATION_REQUIRED = 'REVALIDATION_REQUIRED',
  SUSPENDED = 'SUSPENDED'
}

export interface DataPointValidation {
  dataPointId: string;
  name: string;
  value: any;
  unit?: string;
  validationStatus: 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_APPLICABLE';
  validatedValue?: any;
  deviation?: number;
  threshold?: ValidationThreshold;
  notes?: string;
  source?: 'LAB_REPORT' | 'MANUAL_ENTRY' | 'AUTOMATED_ANALYSIS';
}

export interface ValidationThreshold {
  min?: number;
  max?: number;
  target?: number;
  tolerance?: number;
  unit?: string;
}

export interface ValidationLifecycle {
  validFrom: string;
  validUntil: string;
  formulaVersion: string;
  renewalRequired: boolean;
  renewalDate?: string;
  expiryWarningDays: number;
  autoRenew: boolean;
}

export interface RevalidationTrigger {
  id: string;
  type: 'FORMULA_CHANGE' | 'INGREDIENT_CHANGE' | 'SUPPLIER_CHANGE' | 'REGULATION_UPDATE' | 'PERIODIC' | 'MANUAL';
  description: string;
  triggeredAt: string;
  triggeredBy?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deadline?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ValidationEvent {
  id: string;
  type: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVALIDATED' | 'SUSPENDED';
  timestamp: string;
  userId: string;
  userName?: string;
  description: string;
  changes?: Record<string, any>;
}

export interface Validation {
  id: string;
  status: ValidationStatus;
  type?: 'MANUAL' | 'LABORATORY' | 'AUTOMATED' | 'HYBRID';
  claimsValidated: any;
  dataPoints?: DataPointValidation[];
  summary?: string;
  notes?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  product?: {
    name: string;
    brand: string;
    sku: string;
  };
  reportId?: string;
  report?: Report;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  lifecycle?: ValidationLifecycle;
  revalidationTriggers?: RevalidationTrigger[];
  history?: ValidationEvent[];
  confidence?: number; // 0-100 confidence score for automated validations
  automatedAnalysis?: AnalysisResult;
  feedback?: ValidationFeedback[];
}

export interface CreateValidationData {
  productId: string;
  reportId?: string;
  type?: 'MANUAL' | 'LABORATORY' | 'AUTOMATED' | 'HYBRID';
  status: ValidationStatus;
  claimsValidated: any;
  dataPoints?: DataPointValidation[];
  summary?: string;
  notes?: string;
  lifecycle?: Partial<ValidationLifecycle>;
}

// Automated validation types
export interface AnalysisResult {
  id: string;
  timestamp: string;
  algorithm: string;
  version: string;
  findings: AnalysisFinding[];
  recommendations: string[];
  confidence: number;
  processingTime: number; // in milliseconds
}

export interface AnalysisFinding {
  category: 'COMPLIANCE' | 'ACCURACY' | 'CONSISTENCY' | 'ANOMALY' | 'IMPROVEMENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  dataPoint: string;
  description: string;
  evidence?: string;
  suggestedAction?: string;
}

export interface ValidationFeedback {
  id: string;
  userId: string;
  userName?: string;
  type: 'CORRECTION' | 'CONFIRMATION' | 'DISPUTE' | 'SUGGESTION';
  message: string;
  dataPointId?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ValidationQueue {
  id: string;
  validationId: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  queuedAt: string;
  scheduledFor?: string;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  error?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

// Validation statistics
export interface ValidationMetrics {
  totalValidations: number;
  automatedPercentage: number;
  averageProcessingTime: number;
  accuracyRate: number;
  revalidationRate: number;
  byStatus: Record<ValidationStatus, number>;
  byType: Record<string, number>;
  trendsLast30Days: Array<{
    date: string;
    total: number;
    automated: number;
    manual: number;
  }>;
}

// Validation rule types
export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  dataPointType: string;
  condition: ValidationCondition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationCondition {
  type: 'RANGE' | 'EQUALS' | 'REGEX' | 'CUSTOM' | 'REFERENCE';
  operator?: 'AND' | 'OR';
  value?: any;
  min?: number;
  max?: number;
  pattern?: string;
  reference?: string; // Reference to regulation or standard
  customLogic?: string;
}

// Batch validation types
export interface BatchValidation {
  id: string;
  name: string;
  productIds: string[];
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalProducts: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  startedAt?: string;
  completedAt?: string;
  results?: BatchValidationResult[];
}

export interface BatchValidationResult {
  productId: string;
  productName: string;
  validationId?: string;
  status: ValidationStatus;
  errors?: string[];
  warnings?: string[];
}

// Validation template types
export interface ValidationTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  dataPoints: ValidationDataPointTemplate[];
  rules: ValidationRule[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationDataPointTemplate {
  id: string;
  name: string;
  type: 'NUMERIC' | 'TEXT' | 'BOOLEAN' | 'DATE' | 'ENUM';
  required: boolean;
  unit?: string;
  defaultValue?: any;
  validationRules?: string[]; // Rule IDs
  description?: string;
}

// QR Code types
export interface QRValidationResponse {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    description?: string;
    imageUrl?: string;
    claims: string; // Claims separados por vírgula
    nutritionalInfo?: any;
  };
  validation?: {
    status: string;
    claimsValidated: any;
    summary?: string;
    validatedAt?: string;
    laboratory: {
      name: string;
      accreditation: string;
    };
  };
  isValidated: boolean;
  lastUpdated: string;
}

export interface QRStats {
  product: {
    id: string;
    name: string;
  };
  stats: {
    totalAccesses: number;
    todayAccesses: number;
    weeklyAccesses: number;
    dailyAccesses: Array<{
      date: string;
      count: number;
    }>;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  role?: 'BRAND' | 'LAB';
}

// Statistics types
export interface ValidationStats {
  overview: {
    total: number;
    approved: number;
    rejected: number;
    partial: number;
    pending: number;
    expired: number;
    revalidationRequired: number;
    suspended: number;
  };
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
  automationStats: {
    automated: number;
    manual: number;
    hybrid: number;
    automationRate: number;
  };
  performanceMetrics: {
    averageProcessingTime: number;
    averageConfidence: number;
    revalidationRate: number;
    firstPassRate: number;
  };
  dataPointStats: {
    totalDataPoints: number;
    passedDataPoints: number;
    failedDataPoints: number;
    warningDataPoints: number;
  };
}

// Seal types
export interface Seal {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  issuer?: string;
  validUntil?: string;
}

// Ingredient types
export interface Ingredient {
  name: string;
  description?: string;
  percentage?: number;
  origin?: string;
}

// Re-export certification types (full types are in certifications.ts)
export type { Certification } from './certifications';

// Re-export traceability types (full types are in traceability.ts)
export type { 
  SupplyChainEvent,
  BatchInfo,
  Supplier,
  OriginClaim,
  SupplyChainRoute,
  TraceabilityReport 
} from './traceability';

// Traceability types
export interface TraceabilityData {
  origin?: {
    location: string;
    farm?: string;
    harvestDate?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  processing?: {
    facility: string;
    date?: string;
    certifications?: string[];
  };
  distribution?: {
    center: string;
    temperature?: string;
    transportMode?: string;
  };
  supplyChainMap?: string;
}

// Contact types
export interface ContactInfo {
  manufacturerPhone?: string;
  manufacturerEmail?: string;
  manufacturerWebsite?: string;
  customerServicePhone?: string;
  customerServiceEmail?: string;
  customerServiceHours?: string;
  socialMedia?: {
    [platform: string]: string;
  };
}

// Validation Result types
export interface ValidationResult {
  isValid: boolean;
  productId?: string;
  scans?: number;
  validatedAt?: string;
  message?: string;
}

// Common types
export interface SelectOption {
  value: string;
  label: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
