"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = exports.performanceMiddleware = exports.correlationIdMiddleware = exports.createModuleLogger = exports.morganStream = exports.requestLogger = exports.log = exports.LogLevel = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const env_config_1 = require("../config/env.config");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'gray',
    },
};
winston_1.default.addColors(logLevels.colors);
const devFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const fileRotateTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join('logs', '%DATE%-app.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: prodFormat,
});
const errorFileRotateTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join('logs', '%DATE%-error.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: prodFormat,
});
const logger = winston_1.default.createLogger({
    levels: logLevels.levels,
    level: env_config_1.config.LOG_LEVEL || 'info',
    format: prodFormat,
    defaultMeta: {
        service: 'trust-label-api',
        environment: env_config_1.config.NODE_ENV,
        version: process.env.npm_package_version,
    },
    transports: [
        fileRotateTransport,
        errorFileRotateTransport,
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'exceptions.log'),
            format: prodFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'rejections.log'),
            format: prodFormat,
        }),
    ],
});
if (!(0, env_config_1.isProduction)()) {
    logger.add(new winston_1.default.transports.Console({
        format: devFormat,
        handleExceptions: true,
        handleRejections: true,
    }));
}
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(logger) {
        this.defaultContext = {};
        this.logger = logger;
    }
    setDefaultContext(context) {
        this.defaultContext = { ...this.defaultContext, ...context };
    }
    clearDefaultContext() {
        this.defaultContext = {};
    }
    child(context) {
        const childLogger = new Logger(this.logger);
        childLogger.setDefaultContext({ ...this.defaultContext, ...context });
        return childLogger;
    }
    error(message, context) {
        this.log(LogLevel.ERROR, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    http(message, context) {
        this.log(LogLevel.HTTP, message, context);
    }
    verbose(message, context) {
        this.log(LogLevel.VERBOSE, message, context);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    log(level, message, context) {
        const fullContext = {
            ...this.defaultContext,
            ...context,
            timestamp: new Date().toISOString(),
        };
        this.sanitizeContext(fullContext);
        if (fullContext.error) {
            fullContext.errorMessage = fullContext.error.message;
            fullContext.errorStack = fullContext.error.stack;
            fullContext.errorName = fullContext.error.name;
            delete fullContext.error;
        }
        this.logger.log(level, message, fullContext);
    }
    sanitizeContext(context) {
        const sensitiveFields = [
            'password',
            'token',
            'authorization',
            'cookie',
            'secret',
            'apiKey',
            'creditCard',
            'ssn',
            'cpf',
            'cnpj',
        ];
        const sanitize = (obj, path = '') => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                        obj[key] = '[REDACTED]';
                    }
                    else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitize(obj[key], currentPath);
                    }
                }
            }
        };
        sanitize(context);
    }
    logRequest(req, res, duration) {
        const context = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            statusCode: res.statusCode,
            duration,
            requestId: req.id,
            userId: req.user?.id,
        };
        const level = res.statusCode >= 500 ? LogLevel.ERROR
            : res.statusCode >= 400 ? LogLevel.WARN
                : LogLevel.HTTP;
        this.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, context);
    }
    logError(error, context) {
        this.error(error.message, { ...context, error });
    }
    logDatabaseQuery(query, params, duration) {
        if ((0, env_config_1.isDevelopment)() || env_config_1.config.LOG_LEVEL === 'debug') {
            this.debug('Database query executed', {
                query,
                params: (0, env_config_1.isProduction)() ? '[REDACTED]' : params,
                duration,
            });
        }
    }
    logCacheHit(key, hit) {
        this.verbose(`Cache ${hit ? 'hit' : 'miss'}: ${key}`, {
            cacheKey: key,
            cacheHit: hit,
        });
    }
    logExternalApiCall(service, method, url, duration, statusCode) {
        this.info(`External API call: ${service}`, {
            service,
            method,
            url,
            duration,
            statusCode,
        });
    }
    logSecurityEvent(event, context) {
        this.warn(`Security event: ${event}`, {
            ...context,
            securityEvent: event,
            timestamp: new Date().toISOString(),
        });
    }
    logBusinessEvent(event, context) {
        this.info(`Business event: ${event}`, {
            ...context,
            businessEvent: event,
        });
    }
    logPerformanceMetric(metric, value, unit = 'ms') {
        this.verbose(`Performance metric: ${metric}`, {
            metric,
            value,
            unit,
        });
    }
}
exports.log = new Logger(logger);
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    req.id = req.id || req.headers['x-request-id'] || (0, uuid_1.v4)();
    exports.log.verbose(`Incoming request: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
    });
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        const duration = Date.now() - startTime;
        exports.log.logRequest(req, res, duration);
        return res.send(data);
    };
    next();
};
exports.requestLogger = requestLogger;
exports.morganStream = {
    write: (message) => {
        exports.log.http(message.trim());
    },
};
const createModuleLogger = (moduleName) => {
    return exports.log.child({ module: moduleName });
};
exports.createModuleLogger = createModuleLogger;
const correlationIdMiddleware = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    exports.log.setDefaultContext({ correlationId });
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
const performanceMiddleware = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        if (duration > 1000) {
            exports.log.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
                method: req.method,
                url: req.originalUrl,
                duration,
                threshold: 1000,
            });
        }
        exports.log.logPerformanceMetric(`request_duration_${req.method}_${req.route?.path || 'unknown'}`, duration);
    });
    next();
};
exports.performanceMiddleware = performanceMiddleware;
exports.auditLog = {
    logUserAction: (userId, action, resource, details) => {
        exports.log.info('User action', {
            userId,
            action,
            resource,
            details,
            timestamp: new Date().toISOString(),
            audit: true,
        });
    },
    logSystemAction: (action, details) => {
        exports.log.info('System action', {
            action,
            details,
            timestamp: new Date().toISOString(),
            audit: true,
        });
    },
    logDataAccess: (userId, resource, operation, filters) => {
        exports.log.verbose('Data access', {
            userId,
            resource,
            operation,
            filters: (0, env_config_1.isProduction)() ? '[REDACTED]' : filters,
            timestamp: new Date().toISOString(),
            audit: true,
        });
    },
};
exports.default = exports.log;
//# sourceMappingURL=logger.js.map