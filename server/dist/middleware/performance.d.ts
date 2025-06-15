import { Request, Response, NextFunction } from 'express';
export declare const performanceMonitoring: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const connectionTracking: (req: Request, res: Response, next: NextFunction) => void;
export declare const sentryPerformance: (req: Request, res: Response, next: NextFunction) => void;
export declare const memoryMonitoring: (_req: Request, _res: Response, next: NextFunction) => void;
export declare const cacheMetrics: {
    recordHit: (keyType: string) => void;
    recordMiss: (keyType: string) => void;
};
export declare const securityMonitoring: (req: Request, res: Response, next: NextFunction) => void;
export declare function logSlowQuery(query: string, duration: number, model?: string): void;
export declare const budgetMonitoring: NodeJS.Timeout;
//# sourceMappingURL=performance.d.ts.map