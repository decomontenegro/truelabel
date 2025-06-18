import winston from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug"
}
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
declare class Logger {
    private logger;
    private defaultContext;
    constructor(logger: winston.Logger);
    setDefaultContext(context: LogContext): void;
    clearDefaultContext(): void;
    child(context: LogContext): Logger;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    http(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    private log;
    private sanitizeContext;
    logRequest(req: any, res: any, duration: number): void;
    logError(error: Error, context?: LogContext): void;
    logDatabaseQuery(query: string, params: any[], duration: number): void;
    logCacheHit(key: string, hit: boolean): void;
    logExternalApiCall(service: string, method: string, url: string, duration: number, statusCode?: number): void;
    logSecurityEvent(event: string, context?: LogContext): void;
    logBusinessEvent(event: string, context?: LogContext): void;
    logPerformanceMetric(metric: string, value: number, unit?: string): void;
}
export declare const log: Logger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare const morganStream: {
    write: (message: string) => void;
};
export declare const createModuleLogger: (moduleName: string) => Logger;
export declare const correlationIdMiddleware: (req: any, res: any, next: any) => void;
export declare const performanceMiddleware: (req: any, res: any, next: any) => void;
export declare const auditLog: {
    logUserAction: (userId: string, action: string, resource: string, details?: any) => void;
    logSystemAction: (action: string, details?: any) => void;
    logDataAccess: (userId: string, resource: string, operation: string, filters?: any) => void;
};
export default log;
//# sourceMappingURL=logger.d.ts.map