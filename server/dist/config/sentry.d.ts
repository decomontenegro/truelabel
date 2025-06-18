import * as Sentry from '@sentry/node';
import { Express } from 'express';
export declare const initSentry: (app: Express) => void;
export declare const sentryErrorHandler: any;
export declare const logError: (error: Error, context?: any) => void;
export declare const logEvent: (message: string, level?: Sentry.SeverityLevel, extra?: any) => void;
export declare const startTransaction: (name: string, op: string) => any;
export declare const monitorOperation: <T>(operationName: string, operation: () => Promise<T>, context?: any) => Promise<T>;
export declare const identifyUser: (userId: string, email?: string, role?: string) => void;
export declare const clearUser: () => void;
export declare const addBreadcrumb: (message: string, category: string, data?: any) => void;
export declare const profile: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
export declare const monitorQuery: <T>(queryName: string, query: () => Promise<T>) => Promise<T>;
export declare const monitorAPICall: <T>(apiName: string, call: () => Promise<T>) => Promise<T>;
export declare const recordMetric: (name: string, value: number, unit?: string, tags?: Record<string, string>) => void;
//# sourceMappingURL=sentry.d.ts.map