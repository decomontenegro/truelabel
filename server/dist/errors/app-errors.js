"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.isOperationalError = exports.isAppError = exports.ErrorFactory = exports.InsufficientCreditsError = exports.PaymentError = exports.InvalidFileTypeError = exports.FileSizeError = exports.FileUploadError = exports.CertificationError = exports.QRCodeError = exports.AIServiceError = exports.LaboratoryNotAccreditedError = exports.ProductValidationError = exports.MaintenanceModeError = exports.ServiceUnavailableError = exports.ExternalServiceError = exports.DatabaseError = exports.InternalServerError = exports.RateLimitError = exports.InvalidStateError = exports.BusinessRuleError = exports.ResourceInUseError = exports.DuplicateResourceError = exports.ConflictError = exports.ResourceNotFoundError = exports.NotFoundError = exports.InsufficientPermissionsError = exports.ForbiddenError = exports.InvalidTokenError = exports.TokenExpiredError = exports.InvalidCredentialsError = exports.UnauthorizedError = exports.MissingParameterError = exports.InvalidInputError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true, details) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        this.timestamp = new Date();
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
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', true, details);
    }
}
exports.ValidationError = ValidationError;
class InvalidInputError extends AppError {
    constructor(field, message) {
        super(`Invalid input for ${field}: ${message}`, 400, 'INVALID_INPUT', true, { field });
    }
}
exports.InvalidInputError = InvalidInputError;
class MissingParameterError extends AppError {
    constructor(parameter) {
        super(`Missing required parameter: ${parameter}`, 400, 'MISSING_PARAMETER', true, { parameter });
    }
}
exports.MissingParameterError = MissingParameterError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED', true);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class InvalidCredentialsError extends AppError {
    constructor() {
        super('Invalid email or password', 401, 'INVALID_CREDENTIALS', true);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class TokenExpiredError extends AppError {
    constructor() {
        super('Token has expired', 401, 'TOKEN_EXPIRED', true);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class InvalidTokenError extends AppError {
    constructor() {
        super('Invalid token', 401, 'INVALID_TOKEN', true);
    }
}
exports.InvalidTokenError = InvalidTokenError;
class ForbiddenError extends AppError {
    constructor(resource) {
        const message = resource
            ? `Access denied to ${resource}`
            : 'Access denied';
        super(message, 403, 'FORBIDDEN', true, { resource });
    }
}
exports.ForbiddenError = ForbiddenError;
class InsufficientPermissionsError extends AppError {
    constructor(requiredPermission) {
        super(`Insufficient permissions. Required: ${requiredPermission}`, 403, 'INSUFFICIENT_PERMISSIONS', true, { requiredPermission });
    }
}
exports.InsufficientPermissionsError = InsufficientPermissionsError;
class NotFoundError extends AppError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND', true, { resource, identifier });
    }
}
exports.NotFoundError = NotFoundError;
class ResourceNotFoundError extends AppError {
    constructor(resourceType, id) {
        super(`${resourceType} not found`, 404, `${resourceType.toUpperCase()}_NOT_FOUND`, true, { resourceType, id });
    }
}
exports.ResourceNotFoundError = ResourceNotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT', true, details);
    }
}
exports.ConflictError = ConflictError;
class DuplicateResourceError extends AppError {
    constructor(resource, field, value) {
        super(`${resource} with ${field} '${value}' already exists`, 409, 'DUPLICATE_RESOURCE', true, { resource, field, value });
    }
}
exports.DuplicateResourceError = DuplicateResourceError;
class ResourceInUseError extends AppError {
    constructor(resource) {
        super(`Cannot delete ${resource} as it is currently in use`, 409, 'RESOURCE_IN_USE', true, { resource });
    }
}
exports.ResourceInUseError = ResourceInUseError;
class BusinessRuleError extends AppError {
    constructor(rule, message) {
        super(message, 422, 'BUSINESS_RULE_VIOLATION', true, { rule });
    }
}
exports.BusinessRuleError = BusinessRuleError;
class InvalidStateError extends AppError {
    constructor(entity, currentState, expectedState) {
        super(`${entity} is in invalid state. Current: ${currentState}, Expected: ${expectedState}`, 422, 'INVALID_STATE', true, { entity, currentState, expectedState });
    }
}
exports.InvalidStateError = InvalidStateError;
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
    }
}
exports.RateLimitError = RateLimitError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', details) {
        super(message, 500, 'INTERNAL_ERROR', false, details);
    }
}
exports.InternalServerError = InternalServerError;
class DatabaseError extends AppError {
    constructor(operation, error) {
        super(`Database error during ${operation}`, 500, 'DATABASE_ERROR', false, { operation, originalError: error?.message });
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(service, error) {
        super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', false, { service, originalError: error?.message });
    }
}
exports.ExternalServiceError = ExternalServiceError;
class ServiceUnavailableError extends AppError {
    constructor(service, retryAfter) {
        super(`Service temporarily unavailable: ${service}`, 503, 'SERVICE_UNAVAILABLE', true, { service, retryAfter });
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class MaintenanceModeError extends AppError {
    constructor(message) {
        super(message || 'System is under maintenance', 503, 'MAINTENANCE_MODE', true);
    }
}
exports.MaintenanceModeError = MaintenanceModeError;
class ProductValidationError extends AppError {
    constructor(productId, reason) {
        super(`Product validation failed: ${reason}`, 422, 'PRODUCT_VALIDATION_FAILED', true, { productId, reason });
    }
}
exports.ProductValidationError = ProductValidationError;
class LaboratoryNotAccreditedError extends AppError {
    constructor(laboratoryId, requiredAccreditation) {
        super('Laboratory does not have required accreditation', 403, 'LABORATORY_NOT_ACCREDITED', true, { laboratoryId, requiredAccreditation });
    }
}
exports.LaboratoryNotAccreditedError = LaboratoryNotAccreditedError;
class AIServiceError extends AppError {
    constructor(operation, retryable = true) {
        super(`AI service error during ${operation}`, 503, 'AI_SERVICE_ERROR', true, { operation, retryable });
    }
}
exports.AIServiceError = AIServiceError;
class QRCodeError extends AppError {
    constructor(message, code = 'QR_CODE_ERROR') {
        super(message, 422, code, true);
    }
}
exports.QRCodeError = QRCodeError;
class CertificationError extends AppError {
    constructor(certificationType, reason) {
        super(`Certification error for ${certificationType}: ${reason}`, 422, 'CERTIFICATION_ERROR', true, { certificationType, reason });
    }
}
exports.CertificationError = CertificationError;
class FileUploadError extends AppError {
    constructor(reason, details) {
        super(`File upload failed: ${reason}`, 400, 'FILE_UPLOAD_ERROR', true, details);
    }
}
exports.FileUploadError = FileUploadError;
class FileSizeError extends AppError {
    constructor(maxSize, actualSize) {
        super(`File size exceeds maximum allowed size of ${maxSize} bytes`, 400, 'FILE_SIZE_EXCEEDED', true, { maxSize, actualSize });
    }
}
exports.FileSizeError = FileSizeError;
class InvalidFileTypeError extends AppError {
    constructor(allowedTypes, actualType) {
        super(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400, 'INVALID_FILE_TYPE', true, { allowedTypes, actualType });
    }
}
exports.InvalidFileTypeError = InvalidFileTypeError;
class PaymentError extends AppError {
    constructor(message, details) {
        super(message, 402, 'PAYMENT_ERROR', true, details);
    }
}
exports.PaymentError = PaymentError;
class InsufficientCreditsError extends AppError {
    constructor(required, available) {
        super('Insufficient credits for this operation', 402, 'INSUFFICIENT_CREDITS', true, { required, available });
    }
}
exports.InsufficientCreditsError = InsufficientCreditsError;
class ErrorFactory {
    static createValidationError(errors) {
        const message = 'Validation failed';
        const details = errors.reduce((acc, error) => {
            acc[error.field] = error.message;
            return acc;
        }, {});
        return new ValidationError(message, details);
    }
    static fromError(error) {
        if (error instanceof AppError) {
            return error;
        }
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            return new DuplicateResourceError('Resource', field, 'value');
        }
        if (error.code === 'P2025') {
            return new NotFoundError('Resource');
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return new DuplicateResourceError('Resource', field, 'value');
        }
        return new InternalServerError(error.message || 'An unexpected error occurred', { originalError: error.message, code: error.code });
    }
}
exports.ErrorFactory = ErrorFactory;
const isAppError = (error) => {
    return error instanceof AppError;
};
exports.isAppError = isAppError;
const isOperationalError = (error) => {
    return (0, exports.isAppError)(error) && error.isOperational;
};
exports.isOperationalError = isOperationalError;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCodes["MISSING_PARAMETER"] = "MISSING_PARAMETER";
    ErrorCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCodes["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCodes["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCodes["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCodes["FORBIDDEN"] = "FORBIDDEN";
    ErrorCodes["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCodes["NOT_FOUND"] = "NOT_FOUND";
    ErrorCodes["DUPLICATE_RESOURCE"] = "DUPLICATE_RESOURCE";
    ErrorCodes["RESOURCE_IN_USE"] = "RESOURCE_IN_USE";
    ErrorCodes["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ErrorCodes["INVALID_STATE"] = "INVALID_STATE";
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCodes["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCodes["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCodes["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCodes["PRODUCT_VALIDATION_FAILED"] = "PRODUCT_VALIDATION_FAILED";
    ErrorCodes["LABORATORY_NOT_ACCREDITED"] = "LABORATORY_NOT_ACCREDITED";
    ErrorCodes["AI_SERVICE_ERROR"] = "AI_SERVICE_ERROR";
    ErrorCodes["QR_CODE_ERROR"] = "QR_CODE_ERROR";
    ErrorCodes["CERTIFICATION_ERROR"] = "CERTIFICATION_ERROR";
    ErrorCodes["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    ErrorCodes["FILE_SIZE_EXCEEDED"] = "FILE_SIZE_EXCEEDED";
    ErrorCodes["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCodes["PAYMENT_ERROR"] = "PAYMENT_ERROR";
    ErrorCodes["INSUFFICIENT_CREDITS"] = "INSUFFICIENT_CREDITS";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
//# sourceMappingURL=app-errors.js.map