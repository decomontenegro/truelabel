export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    BY_BARCODE: '/products/barcode',
    CLAIMS: '/products/:id/claims',
  },
  VALIDATIONS: {
    BASE: '/validations',
    BY_PRODUCT: '/validations/product/:productId',
    ACTIVE: '/validations/product/:productId/active',
    SUBMIT: '/validations/:id/submit',
    APPROVE: '/validations/:id/approve',
    REJECT: '/validations/:id/reject',
  },
  AI: {
    EXTRACT_CLAIMS: '/ai/extract-claims',
    PARSE_REPORT: '/ai/parse-report',
    MATCH_CLAIMS: '/ai/match-claims',
    DETECT_ANOMALIES: '/ai/detect-anomalies',
    JOB_STATUS: '/ai/job/:id',
  },
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  NETWORK_ERROR: 'Network connection error',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  BARCODE_MIN_LENGTH: 8,
  BARCODE_MAX_LENGTH: 14,
  SKU_MAX_LENGTH: 50,
  CLAIM_VALUE_MAX_LENGTH: 100,
  CONFIDENCE_MIN: 0,
  CONFIDENCE_MAX: 1,
} as const;

export const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  FULL: 'DD/MM/YYYY HH:mm:ss',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const;

export const SEMANTIC_COLORS = {
  VALIDATED: '#10B981',      // Green
  PENDING: '#F59E0B',        // Amber
  FAILED: '#EF4444',         // Red
  EXPIRED: '#6B7280',        // Gray
  PRIMARY: '#0EA5E9',        // Sky Blue
  SECONDARY: '#8B5CF6',      // Purple
  ACCENT: '#EC4899',         // Pink
} as const;