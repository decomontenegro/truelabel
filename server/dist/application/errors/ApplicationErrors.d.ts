export declare class ApplicationError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare class NotFoundError extends ApplicationError {
    constructor(message: string);
}
export declare class ConflictError extends ApplicationError {
    constructor(message: string);
}
export declare class ValidationError extends ApplicationError {
    constructor(message: string);
}
export declare class UnauthorizedError extends ApplicationError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApplicationError {
    constructor(message?: string);
}
export declare class BusinessRuleError extends ApplicationError {
    constructor(message: string);
}
//# sourceMappingURL=ApplicationErrors.d.ts.map