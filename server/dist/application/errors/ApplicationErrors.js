"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ApplicationError = void 0;
class ApplicationError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
class NotFoundError extends ApplicationError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApplicationError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends ApplicationError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends ApplicationError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApplicationError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class BusinessRuleError extends ApplicationError {
    constructor(message) {
        super(message, 422);
    }
}
exports.BusinessRuleError = BusinessRuleError;
//# sourceMappingURL=ApplicationErrors.js.map