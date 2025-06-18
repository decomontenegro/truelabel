"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.errorRecovery = exports.formatValidationErrors = exports.timeoutHandler = exports.setupErrorBoundaries = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const uuid_1 = require("uuid");
const winston_1 = __importDefault(require("winston"));
const app_errors_1 = require("../errors/app-errors");
const env_config_1 = require("../config/env.config");
const logger = winston_1.default.createLogger({
    level: env_config_1.config.LOG_LEVEL,
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'combined.log' }),
    ],
});
if (!(0, env_config_1.isProduction)()) {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple(),
    }));
}
const logError = (error, req, correlationId) => {
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
            ...((0, app_errors_1.isAppError)(error) && {
                code: error.code,
                statusCode: error.statusCode,
                isOperational: error.isOperational,
                details: error.details,
            }),
        },
    };
    if (errorContext.request.body?.password) {
        errorContext.request.body.password = '[REDACTED]';
    }
    if (errorContext.request.headers['authorization']) {
        errorContext.request.headers['authorization'] = '[REDACTED]';
    }
    if ((0, app_errors_1.isOperationalError)(error)) {
        logger.warn('Operational error occurred', errorContext);
    }
    else {
        logger.error('Unexpected error occurred', errorContext);
    }
};
const sendErrorResponse = (error, req, res, correlationId) => {
    const statusCode = error.statusCode || 500;
    const errorResponse = {
        success: false,
        error: {
            code: error.code,
            message: error.message,
            correlationId,
            timestamp: new Date().toISOString(),
            ...((0, env_config_1.isDevelopment)() && {
                details: error.details,
                path: req.originalUrl,
                method: req.method,
                stack: error.stack,
            }),
        },
    };
    res.setHeader('X-Correlation-Id', correlationId);
    res.status(statusCode).json(errorResponse);
};
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
    if (env_config_1.config.MAINTENANCE_MODE && !req.path.includes('/health')) {
        const maintenanceError = new app_errors_1.MaintenanceModeError(env_config_1.config.MAINTENANCE_MESSAGE);
        return sendErrorResponse(maintenanceError, req, res, correlationId);
    }
    const appError = app_errors_1.ErrorFactory.fromError(err);
    logError(appError, req, correlationId);
    if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        const validationError = app_errors_1.ErrorFactory.createValidationError(validationErrors);
        return sendErrorResponse(validationError, req, res, correlationId);
    }
    if (err.name === 'CastError') {
        const castError = new app_errors_1.AppError('Invalid ID format', 400, 'INVALID_ID_FORMAT', true, { field: err.path, value: err.value });
        return sendErrorResponse(castError, req, res, correlationId);
    }
    if (err.name === 'MongoError' && err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const duplicateError = new app_errors_1.AppError(`Duplicate value for field: ${field}`, 409, 'DUPLICATE_FIELD', true, { field });
        return sendErrorResponse(duplicateError, req, res, correlationId);
    }
    if (err.name === 'JsonWebTokenError') {
        const jwtError = new app_errors_1.AppError('Invalid token', 401, 'INVALID_TOKEN', true);
        return sendErrorResponse(jwtError, req, res, correlationId);
    }
    if (err.name === 'TokenExpiredError') {
        const expiredError = new app_errors_1.AppError('Token has expired', 401, 'TOKEN_EXPIRED', true);
        return sendErrorResponse(expiredError, req, res, correlationId);
    }
    sendErrorResponse(appError, req, res, correlationId);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new app_errors_1.AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND', true, { method: req.method, url: req.originalUrl });
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const setupErrorBoundaries = () => {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            timestamp: new Date().toISOString(),
        });
        if ((0, env_config_1.isProduction)()) {
            process.exit(1);
        }
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection:', {
            reason,
            promise,
            timestamp: new Date().toISOString(),
        });
        if ((0, env_config_1.isProduction)()) {
            process.exit(1);
        }
    });
    process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
};
exports.setupErrorBoundaries = setupErrorBoundaries;
const timeoutHandler = (timeout = 30000) => {
    return (req, res, next) => {
        res.setTimeout(timeout, () => {
            const error = new app_errors_1.AppError('Request timeout', 408, 'REQUEST_TIMEOUT', true, { timeout, url: req.originalUrl });
            next(error);
        });
        next();
    };
};
exports.timeoutHandler = timeoutHandler;
const formatValidationErrors = (errors) => {
    const formattedErrors = errors.map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
    }));
    return app_errors_1.ErrorFactory.createValidationError(formattedErrors);
};
exports.formatValidationErrors = formatValidationErrors;
const errorRecovery = (req, res, next) => {
    res.error = (error, statusCode) => {
        if (statusCode && (0, app_errors_1.isAppError)(error)) {
            error.statusCode = statusCode;
        }
        next(error);
    };
    res.validationError = (errors) => {
        next(app_errors_1.ErrorFactory.createValidationError(errors));
    };
    res.notFound = (resource, identifier) => {
        next(new app_errors_1.AppError(identifier ? `${resource} '${identifier}' not found` : `${resource} not found`, 404, 'NOT_FOUND', true, { resource, identifier }));
    };
    res.forbidden = (message) => {
        next(new app_errors_1.AppError(message || 'Access forbidden', 403, 'FORBIDDEN', true));
    };
    next();
};
exports.errorRecovery = errorRecovery;
const gracefulShutdown = (server) => {
    const shutdown = (signal) => {
        logger.info(`${signal} received, starting graceful shutdown`);
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};
exports.gracefulShutdown = gracefulShutdown;
//# sourceMappingURL=error-handler.middleware.js.map