import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config, isProduction, isDevelopment } from '../config/env.config';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Custom log levels
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

// Add colors to winston
winston.addColors(logLevels.colors);

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// File rotation transport
const fileRotateTransport = new DailyRotateFile({
  filename: path.join('logs', '%DATE%-app.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat,
});

// Error file rotation transport
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join('logs', '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: prodFormat,
});

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: config.LOG_LEVEL || 'info',
  format: prodFormat,
  defaultMeta: {
    service: 'trust-label-api',
    environment: config.NODE_ENV,
    version: process.env.npm_package_version,
  },
  transports: [
    fileRotateTransport,
    errorFileRotateTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'exceptions.log'),
      format: prodFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'rejections.log'),
      format: prodFormat,
    }),
  ],
});

// Add console transport for development
if (!isProduction()) {
  logger.add(new winston.transports.Console({
    format: devFormat,
    handleExceptions: true,
    handleRejections: true,
  }));
}

// Log levels enum
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
}

// Context interface
interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  error?: Error | any;
  [key: string]: any;
}

// Enhanced logger class
class Logger {
  private logger: winston.Logger;
  private defaultContext: LogContext = {};

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  // Set default context for all logs
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  // Clear default context
  clearDefaultContext(): void {
    this.defaultContext = {};
  }

  // Create child logger with specific context
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.logger);
    childLogger.setDefaultContext({ ...this.defaultContext, ...context });
    return childLogger;
  }

  // Log methods with context
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  http(message: string, context?: LogContext): void {
    this.log(LogLevel.HTTP, message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.log(LogLevel.VERBOSE, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Main log method
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const fullContext = {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString(),
    };

    // Sanitize sensitive data
    this.sanitizeContext(fullContext);

    // Add stack trace for errors
    if (fullContext.error) {
      fullContext.errorMessage = fullContext.error.message;
      fullContext.errorStack = fullContext.error.stack;
      fullContext.errorName = fullContext.error.name;
      delete fullContext.error;
    }

    this.logger.log(level, message, fullContext);
  }

  // Sanitize sensitive data from context
  private sanitizeContext(context: LogContext): void {
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

    const sanitize = (obj: any, path: string = ''): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key], currentPath);
          }
        }
      }
    };

    sanitize(context);
  }

  // Specific logging methods
  logRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
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

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, { ...context, error });
  }

  logDatabaseQuery(query: string, params: any[], duration: number): void {
    if (isDevelopment() || config.LOG_LEVEL === 'debug') {
      this.debug('Database query executed', {
        query,
        params: isProduction() ? '[REDACTED]' : params,
        duration,
      });
    }
  }

  logCacheHit(key: string, hit: boolean): void {
    this.verbose(`Cache ${hit ? 'hit' : 'miss'}: ${key}`, {
      cacheKey: key,
      cacheHit: hit,
    });
  }

  logExternalApiCall(service: string, method: string, url: string, duration: number, statusCode?: number): void {
    this.info(`External API call: ${service}`, {
      service,
      method,
      url,
      duration,
      statusCode,
    });
  }

  logSecurityEvent(event: string, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      securityEvent: event,
      timestamp: new Date().toISOString(),
    });
  }

  logBusinessEvent(event: string, context?: LogContext): void {
    this.info(`Business event: ${event}`, {
      ...context,
      businessEvent: event,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.verbose(`Performance metric: ${metric}`, {
      metric,
      value,
      unit,
    });
  }
}

// Create logger instance
export const log = new Logger(logger);

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Generate request ID if not present
  req.id = req.id || req.headers['x-request-id'] || uuidv4();
  
  // Log request start
  log.verbose(`Incoming request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    res.send = originalSend;
    const duration = Date.now() - startTime;
    
    // Log request completion
    log.logRequest(req, res, duration);
    
    return res.send(data);
  };

  next();
};

// Stream for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    log.http(message.trim());
  },
};

// Helper to create logger for specific module
export const createModuleLogger = (moduleName: string): Logger => {
  return log.child({ module: moduleName });
};

// Correlation ID middleware
export const correlationIdMiddleware = (req: any, res: any, next: any) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  
  // Set correlation ID in logger context
  log.setDefaultContext({ correlationId });
  
  next();
};

// Performance monitoring middleware
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    if (duration > 1000) { // Log slow requests (> 1 second)
      log.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        duration,
        threshold: 1000,
      });
    }
    
    log.logPerformanceMetric(`request_duration_${req.method}_${req.route?.path || 'unknown'}`, duration);
  });
  
  next();
};

// Audit logging helper
export const auditLog = {
  logUserAction: (userId: string, action: string, resource: string, details?: any) => {
    log.info('User action', {
      userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      audit: true,
    });
  },
  
  logSystemAction: (action: string, details?: any) => {
    log.info('System action', {
      action,
      details,
      timestamp: new Date().toISOString(),
      audit: true,
    });
  },
  
  logDataAccess: (userId: string, resource: string, operation: string, filters?: any) => {
    log.verbose('Data access', {
      userId,
      resource,
      operation,
      filters: isProduction() ? '[REDACTED]' : filters,
      timestamp: new Date().toISOString(),
      audit: true,
    });
  },
};

// Export logger instance for direct use
export default log;