export declare const CacheTTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 1800;
    readonly LONG: 3600;
    readonly EXTRA_LONG: 21600;
    readonly DAILY: 86400;
    readonly WEEKLY: 604800;
    readonly SESSION: 86400;
};
export declare const CacheKeys: {
    readonly user: (id: string) => string;
    readonly userProfile: (id: string) => string;
    readonly userPermissions: (id: string) => string;
    readonly userNotifications: (id: string) => string;
    readonly product: (id: string) => string;
    readonly productList: (brandId: string, page: number, limit: number) => string;
    readonly productBySlug: (slug: string) => string;
    readonly productQR: (productId: string) => string;
    readonly validation: (id: string) => string;
    readonly validationByCode: (code: string) => string;
    readonly validationStats: (brandId: string) => string;
    readonly report: (id: string) => string;
    readonly reportList: (brandId: string, page: number) => string;
    readonly analytics: {
        readonly qrScans: (productId: string, period: string) => string;
        readonly productPerformance: (brandId: string, period: string) => string;
        readonly consumerInsights: (brandId: string) => string;
        readonly dashboard: (brandId: string) => string;
    };
    readonly smartLabel: (productId: string) => string;
    readonly certification: (id: string) => string;
    readonly certificationsByProduct: (productId: string) => string;
    readonly laboratory: (id: string) => string;
    readonly laboratoryList: () => string;
    readonly rateLimit: {
        readonly api: (ip: string, endpoint: string) => string;
        readonly login: (email: string) => string;
        readonly qrScan: (ip: string) => string;
    };
    readonly session: (id: string) => string;
    readonly temp: {
        readonly emailVerification: (token: string) => string;
        readonly passwordReset: (token: string) => string;
        readonly qrGeneration: (jobId: string) => string;
    };
};
export declare class CacheService {
    get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    del(key: string | string[]): Promise<number>;
    clearPattern(pattern: string): Promise<number>;
    delPattern(pattern: string): Promise<number>;
    invalidateUser(userId: string): Promise<void>;
    invalidateProduct(productId: string, brandId?: string): Promise<void>;
    invalidateValidation(validationId: string, code?: string, brandId?: string): Promise<void>;
    invalidateReport(reportId: string, brandId?: string): Promise<void>;
    invalidateAnalytics(brandId: string): Promise<void>;
    invalidateLaboratory(labId?: string): Promise<void>;
    remember<T>(key: string, ttl: number, callback: () => Promise<T>): Promise<T>;
    private taggedKeys;
    setTagged<T>(key: string, value: T, tags: string[], ttl?: number): Promise<boolean>;
    invalidateTags(tags: string[]): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.d.ts.map