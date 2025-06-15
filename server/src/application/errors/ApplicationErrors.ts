export class ApplicationError extends Error {
  constructor(message: string, public readonly statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class BusinessRuleError extends ApplicationError {
  constructor(message: string) {
    super(message, 422);
  }
}