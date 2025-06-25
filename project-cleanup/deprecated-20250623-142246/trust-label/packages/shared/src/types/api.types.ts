export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface AIJobStatus {
  id: string;
  type: 'CLAIM_EXTRACTION' | 'REPORT_PARSING' | 'VALIDATION_MATCHING' | 'ANOMALY_DETECTION' | 'CONFIDENCE_SCORING';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  attempts: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCodeData {
  id: string;
  productId: string;
  code: string;
  shortUrl: string;
  fullUrl: string;
  version: number;
  isActive: boolean;
  scans: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanLog {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  referrer?: string;
  createdAt: Date;
}