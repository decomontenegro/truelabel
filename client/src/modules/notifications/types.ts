/**
 * Notification Module Types
 * 
 * Módulo responsável por gerenciar todos os tipos de notificações
 * do sistema True Label
 */

export interface BaseNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'VALIDATION_COMPLETED'
  | 'VALIDATION_REJECTED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'REPORT_UPLOADED'
  | 'QR_CODE_GENERATED'
  | 'LABORATORY_ASSIGNED'
  | 'DEADLINE_APPROACHING'
  | 'SYSTEM_MAINTENANCE'
  | 'SECURITY_ALERT'
  | 'PAYMENT_REQUIRED'
  | 'SUBSCRIPTION_EXPIRING';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DISMISSED';

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  types: {
    [K in NotificationType]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  emailTemplate?: string;
  smsTemplate?: string;
  variables: string[];
}

export interface NotificationFilter {
  status?: NotificationStatus[];
  type?: NotificationType[];
  priority?: NotificationPriority[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

// Real-time notification events
export interface NotificationEvent {
  type: 'NEW_NOTIFICATION' | 'NOTIFICATION_READ' | 'NOTIFICATION_DELETED';
  notification: BaseNotification;
  userId: string;
}

// Bulk operations
export interface BulkNotificationAction {
  action: 'MARK_READ' | 'MARK_UNREAD' | 'ARCHIVE' | 'DELETE';
  notificationIds: string[];
}

export interface NotificationBatch {
  notifications: BaseNotification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Email notification data
export interface EmailNotificationData {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// SMS notification data
export interface SMSNotificationData {
  to: string;
  message: string;
  metadata?: Record<string, any>;
}
