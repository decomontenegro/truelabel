import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { 
  AppError, 
  isAppError, 
  isOperationalError,
  ErrorFactory,
  InternalServerError,
  MaintenanceModeError
} from '../errors/app-errors';
import { config, isProduction, isDevelopment } from '../config/env.config';

// Logger instance (you should configure this in a separate file)
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (!isProduction()) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    correlationId: string;
    timestamp: string;
    path?: string;
    method?: string;
    stack?: string;
  };
}

// Log error with context
const logError = (
  error: Error | AppError,
  req: Request,
  correlationId: string
): void => {
  const errorContext = {
    correlationId,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'content-type': req.headers['content-type'],
      },
      ip: req.ip,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    user: req.user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(isAppError(error) && {
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        details: error.details,
      }),
    },
  };

  // Remove sensitive data
  if (errorContext.request.body?.password) {
    errorContext.request.body.password = '[REDACTED]';
  }
  if (errorContext.request.headers['authorization']) {
    errorContext.request.headers['authorization'] = '[REDACTED]';
  }

  // Log based on error type
  if (isOperationalError(error)) {
    logger.warn('Operational error occurred', errorContext);
  } else {
    logger.error('Unexpected error occurred', errorContext);
  }
};

// Send error response to client
const sendErrorResponse = (
  error: AppError,
  req: Request,
  res: Response,
  correlationId: string
): void => {
  const statusCode = error.statusCode || 500;
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      correlationId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment() && {
        details: error.details,
        path: req.originalUrl,
        method: req.method,
        stack: error.stack,
      }),
    },
  };

  // Add additional headers
  res.setHeader('X-Correlation-Id', correlationId);
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

// Main error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Generate correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

  // Check maintenance mode
  if (config.MAINTENANCE_MODE && !req.path.includes('/health')) {
    const maintenanceError = new MaintenanceModeError(config.MAINTENANCE_MESSAGE);
    return sendErrorResponse(maintenanceError, req, res, correlationId);
  }

  // Convert to AppError if needed
  const appError = ErrorFactory.fromError(err);

  // Log the error
  logError(appError, req, correlationId);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const validationErrors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    const validationError = ErrorFactory.createValidationError(validationErrors);
    return sendErrorResponse(validationError, req, res, correlationId);
  }

  if (err.name === 'CastError') {
    // Mongoose cast error
    const castError = new AppError(
      'Invalid ID format',
      400,
      'INVALID_ID_FORMAT',
      true,
      { field: (err as any).path, value: (err as any).value }
    );
    return sendErrorResponse(castError, req, res, correlationId);
  }

  if (err.name === 'MongoError' && (err as any).code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys((err as any).keyPattern)[0];
    const duplicateError = new AppError(
      `Duplicate value for field: ${field}`,
      409,
      'DUPLICATE_FIELD',
      true,
      { field }
    );
    return sendErrorResponse(duplicateError, req, res, correlationId);
  }

  if (err.name === 'JsonWebTokenError') {
    // JWT errors
    const jwtError = new AppError(
      'Invalid token',
      401,
      'INVALID_TOKEN',
      true
    );
    return sendErrorResponse(jwtError, req, res, correlationId);
  }

  if (err.name === 'TokenExpiredError') {
    // JWT expiration
    const expiredError = new AppError(
      'Token has expired',
      401,
      'TOKEN_EXPIRED',
      true
    );
    return sendErrorResponse(expiredError, req, res, correlationId);
  }

  // Send error response
  sendErrorResponse(appError, req, res, correlationId);
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND',
    true,
    { method: req.method, url: req.originalUrl }
  );
  
  next(error);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error boundary for uncaught exceptions
export const setupErrorBoundaries = (): void => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    });

    // Exit process in production
    if (isProduction()) {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason,
      promise,
      timestamp: new Date().toISOString(),
    });

    // Exit process in production
    if (isProduction()) {
      process.exit(1);
    }
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  // Handle SIGINT
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setTimeout(timeout, () => {
      const error = new AppError(
        'Request timeout',
        408,
        'REQUEST_TIMEOUT',
        true,
        { timeout, url: req.originalUrl }
      );
      next(error);
    });
    next();
  };
};

// Validation error formatter for express-validator
export const formatValidationErrors = (errors: any[]): AppError => {
  const formattedErrors = errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value,
  }));

  return ErrorFactory.createValidationError(formattedErrors);
};

// Error recovery middleware
export const errorRecovery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add error handling methods to response
  res.error = (error: Error | AppError, statusCode?: number) => {
    if (statusCode && isAppError(error)) {
      error.statusCode = statusCode;
    }
    next(error);
  };

  res.validationError = (errors: Array<{ field: string; message: string }>) => {
    next(ErrorFactory.createValidationError(errors));
  };

  res.notFound = (resource: string, identifier?: string | number) => {
    next(new AppError(
      identifier ? `${resource} '${identifier}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
      true,
      { resource, identifier }
    ));
  };

  res.forbidden = (message?: string) => {
    next(new AppError(
      message || 'Access forbidden',
      403,
      'FORBIDDEN',
      true
    ));
  };

  next();
};

// Express response augmentation
declare global {
  namespace Express {
    interface Response {
      error: (error: Error | AppError, statusCode?: number) => void;
      validationError: (errors: Array<{ field: string; message: string }>) => void;
      notFound: (resource: string, identifier?: string | number) => void;
      forbidden: (message?: string) => void;
    }
  }
}

// Graceful shutdown handler
export const gracefulShutdown = (server: any): void => {
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections
      // Close Redis connections
      // Close other resources
      
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};