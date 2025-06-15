import { EventEmitter } from 'events';
import type { NotificationData, NotificationFilter, NotificationStats, NotificationPreferences, BulkNotificationAction } from '../types';
declare class NotificationService extends EventEmitter {
    constructor();
    createNotification(data: NotificationData): Promise<any>;
    getNotifications(filters: NotificationFilter): Promise<{
        notifications: any[];
        total: number;
        unreadCount: number;
        hasMore: boolean;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<any>;
    bulkAction(action: BulkNotificationAction): Promise<void>;
    getStats(userId: string): Promise<NotificationStats>;
    getUserPreferences(userId: string): Promise<NotificationPreferences>;
    updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
    private deliverNotification;
    private getNotificationsByType;
    private getNotificationsByPriority;
    private getRecentActivity;
    private createDefaultPreferences;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notificationService.d.ts.map