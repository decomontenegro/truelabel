interface AnalyticsEventData {
    eventType: string;
    entityType: string;
    entityId: string;
    userId?: string | null;
    sessionId?: string | null;
    data?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
}
interface UserInfo {
    userId?: string;
    sessionId?: string;
    location?: any;
    device?: any;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    validationType?: string;
    duration?: number;
    context?: any;
}
interface RealTimeAnalytics {
    qrScans: {
        lastHour: number;
        today: number;
    };
    productViews: {
        lastHour: number;
        today: number;
    };
    validations: {
        today: number;
    };
    activeUsers: number;
    timestamp: string;
}
interface TopProduct {
    qrCode: string;
    scans: number;
}
interface AggregatedPeriod {
    period: string;
    events: Record<string, number>;
    totalEvents: number;
    uniqueUsers: number;
}
declare class AnalyticsEventService {
    private eventBuffer;
    private bufferSize;
    private flushInterval;
    constructor();
    trackEvent(eventData: AnalyticsEventData): Promise<any>;
    trackQRScan(qrCode: string, userInfo?: UserInfo): Promise<any>;
    trackProductView(productId: string, userInfo?: UserInfo): Promise<any>;
    trackValidation(validationId: string, eventType: string, userInfo?: UserInfo): Promise<any>;
    trackUserAction(action: string, entityType: string, entityId: string, userInfo?: UserInfo): Promise<any>;
    getRealTimeAnalytics(): Promise<RealTimeAnalytics>;
    getAnalyticsByPeriod(startDate: Date, endDate: Date, groupBy?: string): Promise<AggregatedPeriod[]>;
    getTopProductsByScans(limit?: number, days?: number): Promise<TopProduct[]>;
    flushBuffer(): Promise<void>;
    private startBufferFlush;
    private emitRealTimeEvent;
    private getEventCount;
    private getActiveUsers;
    private aggregateEventsByPeriod;
    cleanupOldEvents(daysToKeep?: number): Promise<number>;
}
declare const _default: AnalyticsEventService;
export default _default;
//# sourceMappingURL=analyticsEventService.d.ts.map