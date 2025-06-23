/**
 * Notification Service
 * 
 * Serviço para gerenciar notificações via API
 */

import { api } from '@/services/api';
import type {
  BaseNotification,
  NotificationFilter,
  NotificationStats,
  NotificationPreferences,
  BulkNotificationAction,
  NotificationBatch
} from '../types';

class NotificationService {
  private readonly baseUrl = '/notifications';

  /**
   * Buscar notificações com filtros
   */
  async getNotifications(filters: NotificationFilter = {}): Promise<NotificationBatch> {
    const params = new URLSearchParams();
    
    if (filters.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters.type?.length) {
      params.append('type', filters.type.join(','));
    }
    if (filters.priority?.length) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Buscar estatísticas de notificações
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<BaseNotification> {
    const response = await api.patch(`${this.baseUrl}/${notificationId}/read`);
    return response.data;
  }

  /**
   * Marcar notificação como não lida
   */
  async markAsUnread(notificationId: string): Promise<BaseNotification> {
    const response = await api.patch(`${this.baseUrl}/${notificationId}/unread`);
    return response.data;
  }

  /**
   * Arquivar notificação
   */
  async archive(notificationId: string): Promise<BaseNotification> {
    const response = await api.patch(`${this.baseUrl}/${notificationId}/archive`);
    return response.data;
  }

  /**
   * Deletar notificação
   */
  async delete(notificationId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${notificationId}`);
  }

  /**
   * Ações em lote
   */
  async bulkAction(action: BulkNotificationAction): Promise<void> {
    await api.post(`${this.baseUrl}/bulk`, action);
  }

  /**
   * Buscar preferências de notificação
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get(`${this.baseUrl}/preferences`);
    return response.data;
  }

  /**
   * Atualizar preferências de notificação
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put(`${this.baseUrl}/preferences`, preferences);
    return response.data;
  }

  /**
   * Buscar notificação específica
   */
  async getNotification(notificationId: string): Promise<BaseNotification> {
    const response = await api.get(`${this.baseUrl}/${notificationId}`);
    return response.data;
  }

  /**
   * Criar nova notificação (admin)
   */
  async createNotification(notification: Omit<BaseNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<BaseNotification> {
    const response = await api.post(this.baseUrl, notification);
    return response.data;
  }

  /**
   * Buscar notificações não lidas
   */
  async getUnreadNotifications(): Promise<BaseNotification[]> {
    const response = await api.get(`${this.baseUrl}/unread`);
    return response.data;
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get(`${this.baseUrl}/unread/count`);
    return response.data.count;
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead(): Promise<void> {
    await api.post(`${this.baseUrl}/mark-all-read`);
  }

  /**
   * Buscar notificações por tipo
   */
  async getNotificationsByType(type: string): Promise<BaseNotification[]> {
    const response = await api.get(`${this.baseUrl}/type/${type}`);
    return response.data;
  }

  /**
   * Testar notificação (desenvolvimento)
   */
  async testNotification(type: string, userId?: string): Promise<void> {
    await api.post(`${this.baseUrl}/test`, { type, userId });
  }

  /**
   * Registrar dispositivo para push notifications
   */
  async registerDevice(deviceToken: string, platform: 'web' | 'ios' | 'android'): Promise<void> {
    await api.post(`${this.baseUrl}/devices`, { deviceToken, platform });
  }

  /**
   * Desregistrar dispositivo
   */
  async unregisterDevice(deviceToken: string): Promise<void> {
    await api.delete(`${this.baseUrl}/devices/${deviceToken}`);
  }

  /**
   * Buscar templates de notificação (admin)
   */
  async getTemplates(): Promise<any[]> {
    const response = await api.get(`${this.baseUrl}/templates`);
    return response.data;
  }

  /**
   * Atualizar template de notificação (admin)
   */
  async updateTemplate(templateId: string, template: any): Promise<any> {
    const response = await api.put(`${this.baseUrl}/templates/${templateId}`, template);
    return response.data;
  }
}

export const notificationService = new NotificationService();
