import * as Sentry from '@sentry/node';
import type { Express } from 'express';
export declare function initSentry(app: Express): void;
export declare const sentryRequestHandler: () => any;
export declare const sentryTracingHandler: () => any;
export declare const sentryErrorHandler: () => any;
export declare function captureError(error: Error, context?: Record<string, any>): void;
export declare function captureMessage(message: string, level?: Sentry.SeverityLevel): void;
export declare function addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
}): void;
export declare function setUser(user: {
    id: string;
    email?: string;
    role?: string;
} | null): void;
export declare function startTransaction(options: {
    name: string;
    op: string;
    data?: Record<string, any>;
}): any;
export { captureException } from '@sentry/node';
//# sourceMappingURL=sentry.d.ts.map