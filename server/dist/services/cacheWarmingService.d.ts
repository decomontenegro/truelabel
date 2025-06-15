declare class CacheWarmingService {
    private isRunning;
    start(): void;
    private warmCache;
    private warmLaboratories;
    private warmRecentProducts;
    private warmPopularProducts;
    private warmValidationQueue;
    private warmStatistics;
    private warmUserSessions;
    private calculateUserStats;
    cleanup(): Promise<void>;
}
declare const _default: CacheWarmingService;
export default _default;
//# sourceMappingURL=cacheWarmingService.d.ts.map