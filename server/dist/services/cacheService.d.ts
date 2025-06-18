interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    version?: number;
}
interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    keys: number;
}
declare class CacheService {
    private defaultTTL;
    private stats;
    private generateKey;
    private generateHash;
    get<T>(namespace: string, identifier: string, version?: number): Promise<T | null>;
    set<T>(namespace: string, identifier: string, value: T, options?: CacheOptions): Promise<void>;
    delete(namespace: string, identifier: string): Promise<void>;
    deletePattern(pattern: string): Promise<void>;
    invalidateByTags(tags: string[]): Promise<void>;
    getOrCompute<T>(namespace: string, identifier: string, computeFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    cacheQuery<T>(queryKey: string, queryFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    clear(): Promise<void>;
    warmUp(): Promise<void>;
    getStats(): Promise<CacheStats>;
    resetStats(): void;
    mget<T>(keys: Array<{
        namespace: string;
        identifier: string;
    }>): Promise<Map<string, T | null>>;
    acquireLock(key: string, ttl?: number): Promise<boolean>;
    releaseLock(key: string): Promise<void>;
    getOrComputeWithLock<T>(namespace: string, identifier: string, computeFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
}
export declare const CacheKeys: {
    product: (id: string) => {
        namespace: string;
        identifier: string;
    };
    productList: (params: any) => {
        namespace: string;
        identifier: string;
    };
    validation: (id: string) => {
        namespace: string;
        identifier: string;
    };
    user: (id: string) => {
        namespace: string;
        identifier: string;
    };
    qrCode: (code: string) => {
        namespace: string;
        identifier: string;
    };
    analytics: (key: string) => {
        namespace: string;
        identifier: string;
    };
    session: (token: string) => {
        namespace: string;
        identifier: string;
    };
};
export declare const CacheTTL: {
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    SESSION: number;
};
declare const cacheService: CacheService;
export default cacheService;
export declare function Cacheable(options?: CacheOptions & {
    namespace?: string;
}): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function CacheInvalidate(tags: string[]): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function CacheWarm(namespace: string, identifier: string, options?: CacheOptions): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=cacheService.d.ts.map