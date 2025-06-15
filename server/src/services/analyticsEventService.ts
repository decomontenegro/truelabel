/**
 * Analytics Event Service
 *
 * Purpose: Track and store real-time analytics events
 * Dependencies: Prisma Client, WebSocket Service
 *
 * Features:
 * - Event tracking and storage
 * - Real-time analytics aggregation
 * - Performance metrics
 * - User behavior tracking
 * - System monitoring
 */

import { PrismaClient } from '@prisma/client';
import websocketService from './websocketService';

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

const prisma = new PrismaClient();

class AnalyticsEventService {
  private eventBuffer: any[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.startBufferFlush();
  }

  /**
   * Track an analytics event
   */
  async trackEvent(eventData: AnalyticsEventData): Promise<any> {
    try {
      const {
        eventType,
        entityType,
        entityId,
        userId = null,
        sessionId = null,
        data = {},
        ipAddress = null,
        userAgent = null
      } = eventData;

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

      // Add to buffer for batch processing
      this.eventBuffer.push(event);

      // If buffer is full, flush immediately
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }

      // Emit real-time event for immediate processing
      this.emitRealTimeEvent(event);

      return event;
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Track QR code scan
   */
  async trackQRScan(qrCode: string, userInfo: UserInfo = {}): Promise<any> {
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

  /**
   * Track product view
   */
  async trackProductView(productId: string, userInfo: UserInfo = {}): Promise<any> {
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

  /**
   * Track validation event
   */
  async trackValidation(validationId: string, eventType: string, userInfo: UserInfo = {}): Promise<any> {
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

  /**
   * Track user action
   */
  async trackUserAction(action: string, entityType: string, entityId: string, userInfo: UserInfo = {}): Promise<any> {
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

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(): Promise<RealTimeAnalytics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        qrScansLastHour,
        qrScansToday,
        productViewsLastHour,
        productViewsToday,
        validationsToday,
        activeUsers
      ] = await Promise.all([
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
    } catch (error) {
      console.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics by time period
   */
  async getAnalyticsByPeriod(startDate: Date, endDate: Date, groupBy: string = 'day'): Promise<AggregatedPeriod[]> {
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
    } catch (error) {
      console.error('Failed to get analytics by period:', error);
      throw error;
    }
  }

  /**
   * Get top products by scans
   */
  async getTopProductsByScans(limit: number = 10, days: number = 7): Promise<TopProduct[]> {
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

      // Count scans per QR code
      const scanCounts = events.reduce((acc: Record<string, number>, event) => {
        acc[event.entityId] = (acc[event.entityId] || 0) + 1;
        return acc;
      }, {});

      // Sort and limit
      const topQRCodes = Object.entries(scanCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, limit)
        .map(([qrCode, count]) => ({ qrCode, scans: count as number }));

      return topQRCodes;
    } catch (error) {
      console.error('Failed to get top products by scans:', error);
      throw error;
    }
  }

  /**
   * Flush event buffer to database
   */
  async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await prisma.analyticsEvent.createMany({
        data: events,
        skipDuplicates: true
      });

      console.log(`📊 Flushed ${events.length} analytics events to database`);
    } catch (error) {
      console.error('Failed to flush analytics buffer:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startBufferFlush(): void {
    setInterval(async () => {
      await this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * Emit real-time event
   */
  private emitRealTimeEvent(event: any): void {
    try {
      // Emit to WebSocket for real-time updates
      if (websocketService.io) {
        websocketService.broadcastToRole('ADMIN', 'analytics-event', {
          eventType: event.eventType,
          entityType: event.entityType,
          timestamp: event.timestamp
        });
      }
    } catch (error) {
      console.error('Failed to emit real-time event:', error);
    }
  }

  /**
   * Get event count for specific type and time period
   */
  private async getEventCount(eventType: string, since: Date): Promise<number> {
    try {
      const where: any = {
        timestamp: { gte: since }
      };

      if (eventType.includes('%')) {
        // Use LIKE for pattern matching
        where.eventType = { contains: eventType.replace('%', '') };
      } else {
        where.eventType = eventType;
      }

      return await prisma.analyticsEvent.count({ where });
    } catch (error) {
      console.error('Failed to get event count:', error);
      return 0;
    }
  }

  /**
   * Get active users count
   */
  private async getActiveUsers(since: Date): Promise<number> {
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
    } catch (error) {
      console.error('Failed to get active users:', error);
      return 0;
    }
  }

  /**
   * Aggregate events by time period
   */
  private aggregateEventsByPeriod(events: any[], groupBy: string): AggregatedPeriod[] {
    const aggregated: Record<string, any> = {};

    events.forEach(event => {
      let key: string;
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

    // Convert sets to counts
    Object.values(aggregated).forEach((period: any) => {
      period.uniqueUsers = period.uniqueUsers.size;
    });

    return Object.values(aggregated).sort((a: any, b: any) => a.period.localeCompare(b.period));
  }

  /**
   * Cleanup old events
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
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
    } catch (error) {
      console.error('Failed to cleanup old events:', error);
      throw error;
    }
  }
}

export default new AnalyticsEventService();
