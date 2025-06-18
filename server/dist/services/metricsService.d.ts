export interface BusinessMetrics {
    overview: {
        totalProducts: number;
        activeProducts: number;
        totalValidations: number;
        completedValidations: number;
        totalBrands: number;
        activeBrands: number;
        totalQRScans: number;
        uniqueDevices: number;
    };
    growth: {
        productsThisMonth: number;
        productsLastMonth: number;
        productGrowthRate: number;
        validationsThisMonth: number;
        validationsLastMonth: number;
        validationGrowthRate: number;
        scansThisMonth: number;
        scansLastMonth: number;
        scanGrowthRate: number;
    };
    performance: {
        avgValidationTime: number;
        validationSuccessRate: number;
        avgScansPerProduct: number;
        topScanLocations: Array<{
            location: string;
            count: number;
        }>;
        peakScanHours: Array<{
            hour: number;
            count: number;
        }>;
    };
    quality: {
        validationPassRate: number;
        commonFailureReasons: Array<{
            reason: string;
            count: number;
        }>;
        avgProductRating: number;
        certificationRate: number;
    };
    revenue: {
        totalRevenue: number;
        revenueThisMonth: number;
        avgRevenuePerBrand: number;
        topRevenueBrands: Array<{
            brand: string;
            revenue: number;
        }>;
        subscriptionRevenue: number;
        transactionRevenue: number;
    };
    engagement: {
        dailyActiveUsers: number;
        monthlyActiveUsers: number;
        avgSessionDuration: number;
        repeatScanRate: number;
        userRetentionRate: number;
    };
}
export declare class MetricsService {
    static getBusinessMetrics(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<BusinessMetrics>;
    private static getOverviewMetrics;
    private static getGrowthMetrics;
    private static getPerformanceMetrics;
    private static getQualityMetrics;
    private static getRevenueMetrics;
    private static getEngagementMetrics;
    static getRealTimeMetrics(): Promise<{}>;
    static exportMetricsReport(format: 'json' | 'csv', dateRange?: {
        start: Date;
        end: Date;
    }): Promise<string>;
}
export default MetricsService;
//# sourceMappingURL=metricsService.d.ts.map