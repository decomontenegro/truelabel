export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly details?: any;
    readonly timestamp: Date;
    readonly correlationId?: string;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean, details?: any);
    toJSON(): {
        stack?: string | undefined;
        name: string;
        message: string;
        code: string;
        statusCode: number;
        details: any;
        timestamp: Date;
        correlationId: string | undefined;
    };
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class InvalidInputError extends AppError {
    constructor(field: string, message: string);
}
export declare class MissingParameterError extends AppError {
    constructor(parameter: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class InvalidCredentialsError extends AppError {
    constructor();
}
export declare class TokenExpiredError extends AppError {
    constructor();
}
export declare class InvalidTokenError extends AppError {
    constructor();
}
export declare class ForbiddenError extends AppError {
    constructor(resource?: string);
}
export declare class InsufficientPermissionsError extends AppError {
    constructor(requiredPermission: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string | number);
}
export declare class ResourceNotFoundError extends AppError {
    constructor(resourceType: string, id: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: any);
}
export declare class DuplicateResourceError extends AppError {
    constructor(resource: string, field: string, value: string);
}
export declare class ResourceInUseError extends AppError {
    constructor(resource: string);
}
export declare class BusinessRuleError extends AppError {
    constructor(rule: string, message: string);
}
export declare class InvalidStateError extends AppError {
    constructor(entity: string, currentState: string, expectedState: string);
}
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class DatabaseError extends AppError {
    constructor(operation: string, error?: any);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, error?: any);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(service: string, retryAfter?: number);
}
export declare class MaintenanceModeError extends AppError {
    constructor(message?: string);
}
export declare class ProductValidationError extends AppError {
    constructor(productId: string, reason: string);
}
export declare class LaboratoryNotAccreditedError extends AppError {
    constructor(laboratoryId: string, requiredAccreditation: string);
}
export declare class AIServiceError extends AppError {
    constructor(operation: string, retryable?: boolean);
}
export declare class QRCodeError extends AppError {
    constructor(message: string, code?: string);
}
export declare class CertificationError extends AppError {
    constructor(certificationType: string, reason: string);
}
export declare class FileUploadError extends AppError {
    constructor(reason: string, details?: any);
}
export declare class FileSizeError extends AppError {
    constructor(maxSize: number, actualSize: number);
}
export declare class InvalidFileTypeError extends AppError {
    constructor(allowedTypes: string[], actualType: string);
}
export declare class PaymentError extends AppError {
    constructor(message: string, details?: any);
}
export declare class InsufficientCreditsError extends AppError {
    constructor(required: number, available: number);
}
export declare class ErrorFactory {
    static createValidationError(errors: Array<{
        field: string;
        message: string;
    }>): ValidationError;
    static fromError(error: any): AppError;
}
export declare const isAppError: (error: any) => error is AppError;
export declare const isOperationalError: (error: any) => boolean;
export declare enum ErrorCodes {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_PARAMETER = "MISSING_PARAMETER",
    UNAUTHORIZED = "UNAUTHORIZED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    FORBIDDEN = "FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    NOT_FOUND = "NOT_FOUND",
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    RESOURCE_IN_USE = "RESOURCE_IN_USE",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INVALID_STATE = "INVALID_STATE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    PRODUCT_VALIDATION_FAILED = "PRODUCT_VALIDATION_FAILED",
    LABORATORY_NOT_ACCREDITED = "LABORATORY_NOT_ACCREDITED",
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
    QR_CODE_ERROR = "QR_CODE_ERROR",
    CERTIFICATION_ERROR = "CERTIFICATION_ERROR",
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
    FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    PAYMENT_ERROR = "PAYMENT_ERROR",
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"
}
//# sourceMappingURL=app-errors.d.ts.map