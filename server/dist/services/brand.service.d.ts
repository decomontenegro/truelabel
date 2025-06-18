export interface DateRange {
    start: Date;
    end: Date;
}
export declare class BrandService {
    static getDashboardData(brandId: string, dateRange?: DateRange): Promise<{}>;
    static getBrandWithCounts(brandId: string): Promise<unknown>;
    static getBrandAnalytics(brandId: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<{}>;
    static getTopProducts(brandId: string, limit?: number, metric?: 'scans' | 'validations'): Promise<{}>;
    static getComplianceScore(brandId: string): Promise<{}>;
}
export default BrandService;
//# sourceMappingURL=brand.service.d.ts.map