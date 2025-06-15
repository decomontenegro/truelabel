declare class RedisClient {
    private client;
    private isConnected;
    private reconnectTimeout;
    private readonly maxReconnectAttempts;
    private reconnectAttempts;
    constructor();
    private connect;
    isAvailable(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    del(key: string | string[]): Promise<number>;
    clearPattern(pattern: string): Promise<number>;
    incr(key: string): Promise<number | null>;
    hset(key: string, field: string, value: string): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    zadd(key: string, score: number, member: string): Promise<boolean>;
    zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]>;
    publish(channel: string, message: string): Promise<boolean>;
    disconnect(): Promise<void>;
}
export declare const redis: RedisClient;
declare class CacheService {
    private memoryCache;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    private cleanupMemoryCache;
}
export declare const cache: CacheService;
export declare const CacheKeys: {
    readonly user: (id: string) => string;
    readonly userByEmail: (email: string) => string;
    readonly product: (id: string) => string;
    readonly productList: (userId: string, page: number) => string;
    readonly productBySku: (sku: string) => string;
    readonly validation: (id: string) => string;
    readonly validationQueue: () => string;
    readonly analytics: (type: string, period: string) => string;
    readonly qrScans: (qrCode: string) => string;
    readonly report: (id: string) => string;
    readonly reportList: (productId: string) => string;
    readonly laboratory: (id: string) => string;
    readonly laboratoryList: () => string;
    readonly session: (token: string) => string;
    readonly rateLimit: (identifier: string, endpoint: string) => string;
};
export declare const CacheTTL: {
    readonly short: 300;
    readonly medium: 3600;
    readonly long: 86400;
    readonly week: 604800;
};
export {};
//# sourceMappingURL=redis.d.ts.map