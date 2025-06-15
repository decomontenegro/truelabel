declare class PerformanceService {
    getSystemMetrics(): Promise<{
        process: {
            uptime: number;
            cpu: {
                user: number;
                system: number;
            };
            memory: {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
                arrayBuffers: number;
            };
        };
        system: {
            totalMemory: number;
            freeMemory: number;
            usedMemory: number;
            memoryUsagePercent: string;
            loadAverage: {
                '1m': number;
                '5m': number;
                '15m': number;
            };
            cpuCount: number;
        };
    }>;
    getDatabaseMetrics(): Promise<{
        counts: {
            products: number;
            validations: number;
            reports: number;
            users: number;
        };
        validations: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
            approvalRate: string;
        };
    } | null>;
    getPrometheusMetrics(): Promise<Record<string, any> | null>;
    private parsePrometheusMetrics;
    private parseLabels;
    generatePerformanceReport(): Promise<{
        timestamp: string;
        system: {
            process: {
                uptime: number;
                cpu: {
                    user: number;
                    system: number;
                };
                memory: {
                    rss: number;
                    heapTotal: number;
                    heapUsed: number;
                    external: number;
                    arrayBuffers: number;
                };
            };
            system: {
                totalMemory: number;
                freeMemory: number;
                usedMemory: number;
                memoryUsagePercent: string;
                loadAverage: {
                    '1m': number;
                    '5m': number;
                    '15m': number;
                };
                cpuCount: number;
            };
        };
        database: {
            counts: {
                products: number;
                validations: number;
                reports: number;
                users: number;
            };
            validations: {
                total: number;
                pending: number;
                approved: number;
                rejected: number;
                approvalRate: string;
            };
        } | null;
        metrics: Record<string, any> | null;
    }>;
    private summarizeMetrics;
    private groupByLabel;
    checkPerformanceAlerts(): Promise<string[]>;
    startPeriodicMonitoring(intervalMinutes?: number): void;
}
declare const _default: PerformanceService;
export default _default;
//# sourceMappingURL=performanceService.d.ts.map