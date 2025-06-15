import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';
export declare const httpRequestTotal: Counter<"route" | "method" | "status_code">;
export declare const validationTotal: Counter<"type" | "status">;
export declare const qrScanTotal: Counter<"product_category">;
export declare const authAttempts: Counter<"type" | "success">;
export declare const cacheHits: Counter<"key_type">;
export declare const cacheMisses: Counter<"key_type">;
export declare const httpRequestDuration: Histogram<"route" | "method" | "status_code">;
export declare const dbQueryDuration: Histogram<"operation" | "model">;
export declare const fileUploadSize: Histogram<"type">;
export declare const activeConnections: Gauge<"type">;
export declare const pendingValidations: Gauge<string>;
export declare const cacheSize: Gauge<string>;
export declare const redisConnections: Gauge<string>;
export declare const apiResponseTime: Summary<"endpoint">;
export declare const productMetrics: {
    created: Counter<"brand" | "category">;
    validated: Counter<"category" | "validation_type">;
};
export declare const reportMetrics: {
    uploaded: Counter<"laboratory" | "analysis_type">;
    parsed: Counter<"success">;
};
export declare const performanceMetrics: {
    cacheEfficiency: Gauge<string>;
};
export declare function recordError(error: Error, context: {
    route?: string;
    userId?: string;
}): void;
export declare function measureOperation<T>(operation: string, labels: Record<string, string>, fn: () => Promise<T>): Promise<T>;
export declare function metricsEndpoint(): (_req: any, res: any) => Promise<void>;
export declare function resetMetrics(): void;
export { register };
//# sourceMappingURL=metrics.d.ts.map