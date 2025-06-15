"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const websocketService_1 = __importDefault(require("./websocketService"));
const prisma = new client_1.PrismaClient();
class AnalyticsEventService {
    constructor() {
        this.eventBuffer = [];
        this.bufferSize = 100;
        this.flushInterval = 30000;
        this.startBufferFlush();
    }
    async trackEvent(eventData) {
        try {
            const { eventType, entityType, entityId, userId = null, sessionId = null, data = {}, ipAddress = null, userAgent = null } = eventData;
            const event = {
                eventType,
                entityType,
                entityId,
                userId,
                sessionId,
                data: JSON.stringify(data),
                ipAddress,
                userAgent,
                timestamp: new Date()
            };
            this.eventBuffer.push(event);
            if (this.eventBuffer.length >= this.bufferSize) {
                await this.flushBuffer();
            }
            this.emitRealTimeEvent(event);
            return event;
        }
        catch (error) {
            console.error('Failed to track event:', error);
            throw error;
        }
    }
    async trackQRScan(qrCode, userInfo = {}) {
        return await this.trackEvent({
            eventType: 'QR_SCAN',
            entityType: 'QR_CODE',
            entityId: qrCode,
            userId: userInfo.userId,
            sessionId: userInfo.sessionId,
            data: {
                scanTime: new Date().toISOString(),
                location: userInfo.location,
                device: userInfo.device
            },
            ipAddress: userInfo.ipAddress,
            userAgent: userInfo.userAgent
        });
    }
    async trackProductView(productId, userInfo = {}) {
        return await this.trackEvent({
            eventType: 'PRODUCT_VIEW',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: userInfo.userId,
            sessionId: userInfo.sessionId,
            data: {
                viewTime: new Date().toISOString(),
                referrer: userInfo.referrer,
                device: userInfo.device
            },
            ipAddress: userInfo.ipAddress,
            userAgent: userInfo.userAgent
        });
    }
    async trackValidation(validationId, eventType, userInfo = {}) {
        return await this.trackEvent({
            eventType: `VALIDATION_${eventType.toUpperCase()}`,
            entityType: 'VALIDATION',
            entityId: validationId,
            userId: userInfo.userId,
            sessionId: userInfo.sessionId,
            data: {
                eventTime: new Date().toISOString(),
                validationType: userInfo.validationType,
                duration: userInfo.duration
            },
            ipAddress: userInfo.ipAddress,
            userAgent: userInfo.userAgent
        });
    }
    async trackUserAction(action, entityType, entityId, userInfo = {}) {
        return await this.trackEvent({
            eventType: `USER_${action.toUpperCase()}`,
            entityType: entityType.toUpperCase(),
            entityId,
            userId: userInfo.userId,
            sessionId: userInfo.sessionId,
            data: {
                actionTime: new Date().toISOString(),
                context: userInfo.context
            },
            ipAddress: userInfo.ipAddress,
            userAgent: userInfo.userAgent
        });
    }
    async getRealTimeAnalytics() {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const [qrScansLastHour, qrScansToday, productViewsLastHour, productViewsToday, validationsToday, activeUsers] = await Promise.all([
                this.getEventCount('QR_SCAN', oneHourAgo),
                this.getEventCount('QR_SCAN', oneDayAgo),
                this.getEventCount('PRODUCT_VIEW', oneHourAgo),
                this.getEventCount('PRODUCT_VIEW', oneDayAgo),
                this.getEventCount('VALIDATION_%', oneDayAgo),
                this.getActiveUsers(oneHourAgo)
            ]);
            return {
                qrScans: {
                    lastHour: qrScansLastHour,
                    today: qrScansToday
                },
                productViews: {
                    lastHour: productViewsLastHour,
                    today: productViewsToday
                },
                validations: {
                    today: validationsToday
                },
                activeUsers,
                timestamp: now.toISOString()
            };
        }
        catch (error) {
            console.error('Failed to get real-time analytics:', error);
            throw error;
        }
    }
    async getAnalyticsByPeriod(startDate, endDate, groupBy = 'day') {
        try {
            const events = await prisma.analyticsEvent.findMany({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    eventType: true,
                    entityType: true,
                    timestamp: true,
                    userId: true
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });
            return this.aggregateEventsByPeriod(events, groupBy);
        }
        catch (error) {
            console.error('Failed to get analytics by period:', error);
            throw error;
        }
    }
    async getTopProductsByScans(limit = 10, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const events = await prisma.analyticsEvent.findMany({
                where: {
                    eventType: 'QR_SCAN',
                    timestamp: {
                        gte: startDate
                    }
                },
                select: {
                    entityId: true
                }
            });
            const scanCounts = events.reduce((acc, event) => {
                acc[event.entityId] = (acc[event.entityId] || 0) + 1;
                return acc;
            }, {});
            const topQRCodes = Object.entries(scanCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([qrCode, count]) => ({ qrCode, scans: count }));
            return topQRCodes;
        }
        catch (error) {
            console.error('Failed to get top products by scans:', error);
            throw error;
        }
    }
    async flushBuffer() {
        if (this.eventBuffer.length === 0)
            return;
        const events = [...this.eventBuffer];
        this.eventBuffer = [];
        try {
            await prisma.analyticsEvent.createMany({
                data: events,
                skipDuplicates: true
            });
            console.log(`📊 Flushed ${events.length} analytics events to database`);
        }
        catch (error) {
            console.error('Failed to flush analytics buffer:', error);
            this.eventBuffer.unshift(...events);
        }
    }
    startBufferFlush() {
        setInterval(async () => {
            await this.flushBuffer();
        }, this.flushInterval);
    }
    emitRealTimeEvent(event) {
        try {
            if (websocketService_1.default.io) {
                websocketService_1.default.broadcastToRole('ADMIN', 'analytics-event', {
                    eventType: event.eventType,
                    entityType: event.entityType,
                    timestamp: event.timestamp
                });
            }
        }
        catch (error) {
            console.error('Failed to emit real-time event:', error);
        }
    }
    async getEventCount(eventType, since) {
        try {
            const where = {
                timestamp: { gte: since }
            };
            if (eventType.includes('%')) {
                where.eventType = { contains: eventType.replace('%', '') };
            }
            else {
                where.eventType = eventType;
            }
            return await prisma.analyticsEvent.count({ where });
        }
        catch (error) {
            console.error('Failed to get event count:', error);
            return 0;
        }
    }
    async getActiveUsers(since) {
        try {
            const uniqueUsers = await prisma.analyticsEvent.findMany({
                where: {
                    timestamp: { gte: since },
                    userId: { not: null }
                },
                select: {
                    userId: true
                },
                distinct: ['userId']
            });
            return uniqueUsers.length;
        }
        catch (error) {
            console.error('Failed to get active users:', error);
            return 0;
        }
    }
    aggregateEventsByPeriod(events, groupBy) {
        const aggregated = {};
        events.forEach(event => {
            let key;
            const date = new Date(event.timestamp);
            switch (groupBy) {
                case 'hour':
                    key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
                    break;
                case 'day':
                    key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }
            if (!aggregated[key]) {
                aggregated[key] = {
                    period: key,
                    events: {},
                    totalEvents: 0,
                    uniqueUsers: new Set()
                };
            }
            aggregated[key].events[event.eventType] = (aggregated[key].events[event.eventType] || 0) + 1;
            aggregated[key].totalEvents++;
            if (event.userId) {
                aggregated[key].uniqueUsers.add(event.userId);
            }
        });
        Object.values(aggregated).forEach((period) => {
            period.uniqueUsers = period.uniqueUsers.size;
        });
        return Object.values(aggregated).sort((a, b) => a.period.localeCompare(b.period));
    }
    async cleanupOldEvents(daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const deleted = await prisma.analyticsEvent.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate
                    }
                }
            });
            console.log(`🧹 Cleaned up ${deleted.count} old analytics events`);
            return deleted.count;
        }
        catch (error) {
            console.error('Failed to cleanup old events:', error);
            throw error;
        }
    }
}
exports.default = new AnalyticsEventService();
//# sourceMappingURL=analyticsEventService.js.map