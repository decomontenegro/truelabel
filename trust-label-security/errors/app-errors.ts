// Base error class for all application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

// 400 Bad Request errors
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class InvalidInputError extends AppError {
  constructor(field: string, message: string) {
    super(`Invalid input for ${field}: ${message}`, 400, 'INVALID_INPUT', true, { field });
  }
}

export class MissingParameterError extends AppError {
  constructor(parameter: string) {
    super(`Missing required parameter: ${parameter}`, 400, 'MISSING_PARAMETER', true, { parameter });
  }
}

// 401 Unauthorized errors
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 401, 'INVALID_CREDENTIALS', true);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED', true);
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super('Invalid token', 401, 'INVALID_TOKEN', true);
  }
}

// 403 Forbidden errors
export class ForbiddenError extends AppError {
  constructor(resource?: string) {
    const message = resource 
      ? `Access denied to ${resource}` 
      : 'Access denied';
    super(message, 403, 'FORBIDDEN', true, { resource });
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(requiredPermission: string) {
    super(
      `Insufficient permissions. Required: ${requiredPermission}`,
      403,
      'INSUFFICIENT_PERMISSIONS',
      true,
      { requiredPermission }
    );
  }
}

// 404 Not Found errors
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true, { resource, identifier });
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resourceType: string, id: string) {
    super(
      `${resourceType} not found`,
      404,
      `${resourceType.toUpperCase()}_NOT_FOUND`,
      true,
      { resourceType, id }
    );
  }
}

// 409 Conflict errors
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class DuplicateResourceError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      409,
      'DUPLICATE_RESOURCE',
      true,
      { resource, field, value }
    );
  }
}

export class ResourceInUseError extends AppError {
  constructor(resource: string) {
    super(
      `Cannot delete ${resource} as it is currently in use`,
      409,
      'RESOURCE_IN_USE',
      true,
      { resource }
    );
  }
}

// 422 Unprocessable Entity errors
export class BusinessRuleError extends AppError {
  constructor(rule: string, message: string) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', true, { rule });
  }
}

export class InvalidStateError extends AppError {
  constructor(entity: string, currentState: string, expectedState: string) {
    super(
      `${entity} is in invalid state. Current: ${currentState}, Expected: ${expectedState}`,
      422,
      'INVALID_STATE',
      true,
      { entity, currentState, expectedState }
    );
  }
}

// 429 Too Many Requests
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests, please try again later',
      429,
      'RATE_LIMIT_EXCEEDED',
      true,
      { retryAfter }
    );
  }
}

// 500 Internal Server errors
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', false, details);
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, error?: any) {
    super(
      `Database error during ${operation}`,
      500,
      'DATABASE_ERROR',
      false,
      { operation, originalError: error?.message }
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, error?: any) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      false,
      { service, originalError: error?.message }
    );
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(service: string, retryAfter?: number) {
    super(
      `Service temporarily unavailable: ${service}`,
      503,
      'SERVICE_UNAVAILABLE',
      true,
      { service, retryAfter }
    );
  }
}

export class MaintenanceModeError extends AppError {
  constructor(message?: string) {
    super(
      message || 'System is under maintenance',
      503,
      'MAINTENANCE_MODE',
      true
    );
  }
}

// Domain-specific errors
export class ProductValidationError extends AppError {
  constructor(productId: string, reason: string) {
    super(
      `Product validation failed: ${reason}`,
      422,
      'PRODUCT_VALIDATION_FAILED',
      true,
      { productId, reason }
    );
  }
}

export class LaboratoryNotAccreditedError extends AppError {
  constructor(laboratoryId: string, requiredAccreditation: string) {
    super(
      'Laboratory does not have required accreditation',
      403,
      'LABORATORY_NOT_ACCREDITED',
      true,
      { laboratoryId, requiredAccreditation }
    );
  }
}

export class AIServiceError extends AppError {
  constructor(operation: string, retryable: boolean = true) {
    super(
      `AI service error during ${operation}`,
      503,
      'AI_SERVICE_ERROR',
      true,
      { operation, retryable }
    );
  }
}

export class QRCodeError extends AppError {
  constructor(message: string, code: string = 'QR_CODE_ERROR') {
    super(message, 422, code, true);
  }
}

export class CertificationError extends AppError {
  constructor(certificationType: string, reason: string) {
    super(
      `Certification error for ${certificationType}: ${reason}`,
      422,
      'CERTIFICATION_ERROR',
      true,
      { certificationType, reason }
    );
  }
}

// File-related errors
export class FileUploadError extends AppError {
  constructor(reason: string, details?: any) {
    super(`File upload failed: ${reason}`, 400, 'FILE_UPLOAD_ERROR', true, details);
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: number, actualSize: number) {
    super(
      `File size exceeds maximum allowed size of ${maxSize} bytes`,
      400,
      'FILE_SIZE_EXCEEDED',
      true,
      { maxSize, actualSize }
    );
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(allowedTypes: string[], actualType: string) {
    super(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400,
      'INVALID_FILE_TYPE',
      true,
      { allowedTypes, actualType }
    );
  }
}

// Payment-related errors
export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 402, 'PAYMENT_ERROR', true, details);
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    super(
      'Insufficient credits for this operation',
      402,
      'INSUFFICIENT_CREDITS',
      true,
      { required, available }
    );
  }
}

// Error factory
export class ErrorFactory {
  static createValidationError(errors: Array<{ field: string; message: string }>): ValidationError {
    const message = 'Validation failed';
    const details = errors.reduce((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {} as Record<string, string>);
    
    return new ValidationError(message, details);
  }

  static fromError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return new DuplicateResourceError('Resource', field, 'value');
    }

    if (error.code === 'P2025') {
      return new NotFoundError('Resource');
    }

    // Handle MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return new DuplicateResourceError('Resource', field, 'value');
    }

    // Default to internal server error
    return new InternalServerError(
      error.message || 'An unexpected error occurred',
      { originalError: error.message, code: error.code }
    );
  }
}

// Type guards
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  return isAppError(error) && error.isOperational;
};

// Error codes enum for consistency
export enum ErrorCodes {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_IN_USE = 'RESOURCE_IN_USE',
  
  // Business logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Domain specific
  PRODUCT_VALIDATION_FAILED = 'PRODUCT_VALIDATION_FAILED',
  LABORATORY_NOT_ACCREDITED = 'LABORATORY_NOT_ACCREDITED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  QR_CODE_ERROR = 'QR_CODE_ERROR',
  CERTIFICATION_ERROR = 'CERTIFICATION_ERROR',
  
  // Files
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Payment
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
}