import winston from 'winston';
declare const logger: winston.Logger;
export declare const httpLogger: winston.Logger;
export interface LogMeta {
    userId?: string;
    productId?: string;
    action?: string;
    duration?: number;
    error?: Error;
    [key: string]: any;
}
export declare const log: {
    info: (message: string, meta?: LogMeta) => winston.Logger;
    error: (message: string, error?: Error | LogMeta, meta?: LogMeta) => void;
    warn: (message: string, meta?: LogMeta) => winston.Logger;
    debug: (message: string, meta?: LogMeta) => winston.Logger;
    http: (message: string, meta?: LogMeta) => winston.Logger;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map