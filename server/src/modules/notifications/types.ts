/**
 * Notification Module Types - Backend
 * 
 * Tipos TypeScript para o módulo de notificações no backend
 */

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
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

export interface NotificationFilter {
  userId?: string;
  status?: NotificationStatus[];
  type?: NotificationType[];
  priority?: NotificationPriority[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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

export interface BulkNotificationAction {
  action: 'MARK_READ' | 'MARK_UNREAD' | 'ARCHIVE' | 'DELETE';
  notificationIds: string[];
  userId: string;
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

export interface EmailNotificationPayload {
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

export interface PushNotificationPayload {
  userId: string;
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

export interface SMSNotificationPayload {
  to: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    userRole?: string[];
    notificationType?: NotificationType[];
    priority?: NotificationPriority[];
  };
  actions: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    webhook?: string;
  };
  enabled: boolean;
}

export interface NotificationEvent {
  type: 'NEW_NOTIFICATION' | 'NOTIFICATION_READ' | 'NOTIFICATION_DELETED';
  notification: any;
  userId: string;
  timestamp: Date;
}

export interface NotificationQueue {
  id: string;
  notificationData: NotificationData;
  channels: string[];
  scheduledFor?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
  timestamp: Date;
}
