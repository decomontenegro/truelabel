/**
 * Notification Module Exports
 * 
 * Ponto central de exportação do módulo de notificações
 */

// Types
export type {
  BaseNotification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationFilter,
  NotificationStats,
  NotificationEvent,
  BulkNotificationAction,
  NotificationBatch,
  PushNotificationPayload,
  EmailNotificationData,
  SMSNotificationData
} from './types';

// Hooks
export {
  useNotifications,
  useRealTimeNotifications,
  useNotificationPreferences,
  useNotificationStats,
  NOTIFICATION_QUERY_KEYS
} from './hooks/useNotifications';

// Services
export { notificationService } from './services/notificationService';

// Components
export { NotificationCenter } from './components/NotificationCenter';
export { NotificationItem } from './components/NotificationItem';
export { NotificationFilters } from './components/NotificationFilters';

// Utils (to be created)
export { notificationUtils } from './utils/notificationUtils';

// Constants
export const NOTIFICATION_TYPES = {
  VALIDATION_COMPLETED: 'VALIDATION_COMPLETED',
  VALIDATION_REJECTED: 'VALIDATION_REJECTED',
  PRODUCT_APPROVED: 'PRODUCT_APPROVED',
  PRODUCT_REJECTED: 'PRODUCT_REJECTED',
  REPORT_UPLOADED: 'REPORT_UPLOADED',
  QR_CODE_GENERATED: 'QR_CODE_GENERATED',
  LABORATORY_ASSIGNED: 'LABORATORY_ASSIGNED',
  DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SECURITY_ALERT: 'SECURITY_ALERT',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const NOTIFICATION_STATUSES = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  ARCHIVED: 'ARCHIVED',
  DISMISSED: 'DISMISSED',
} as const;
