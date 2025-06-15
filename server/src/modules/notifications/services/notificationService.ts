/**
 * Notification Service - Backend
 * 
 * Serviço principal para gerenciar notificações no backend
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { notificationTemplateService } from './notificationTemplateService';
import { emailService } from './emailService';
import { pushService } from './pushService';
import { smsService } from './smsService';
import type {
  NotificationData,
  NotificationFilter,
  NotificationStats,
  NotificationPreferences,
  BulkNotificationAction,
  NotificationEvent,
  NotificationDeliveryResult
} from '../types';

const prisma = new PrismaClient();

class NotificationService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Criar nova notificação
   */
  async createNotification(data: NotificationData): Promise<any> {
    try {
      // Criar notificação no banco
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'MEDIUM',
          status: 'UNREAD',
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      // Buscar preferências do usuário
      const preferences = await this.getUserPreferences(data.userId);

      // Enviar através dos canais habilitados
      await this.deliverNotification(notification, preferences);

      // Emitir evento em tempo real
      this.emit('notification:created', {
        type: 'NEW_NOTIFICATION',
        notification,
        userId: data.userId,
        timestamp: new Date(),
      } as NotificationEvent);

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Buscar notificações com filtros
   */
  async getNotifications(filters: NotificationFilter): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const {
        userId,
        status,
        type,
        priority,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const where: any = {};

      if (userId) where.userId = userId;
      if (status?.length) where.status = { in: status };
      if (type?.length) where.type = { in: type };
      if (priority?.length) where.priority = { in: priority };
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { ...where, status: 'UNREAD' }
        }),
      ]);

      return {
        notifications,
        total,
        unreadCount,
        hasMore: total > page * limit,
      };
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Garantir que o usuário só pode marcar suas próprias notificações
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      this.emit('notification:read', {
        type: 'NOTIFICATION_READ',
        notification,
        userId,
        timestamp: new Date(),
      } as NotificationEvent);

      return notification;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Ações em lote
   */
  async bulkAction(action: BulkNotificationAction): Promise<void> {
    try {
      const { action: actionType, notificationIds, userId } = action;

      const updateData: any = {};

      switch (actionType) {
        case 'MARK_READ':
          updateData.status = 'read';
          updateData.readAt = new Date();
          break;
        case 'MARK_UNREAD':
          updateData.status = 'UNREAD';
          updateData.readAt = null;
          break;
        case 'ARCHIVE':
          updateData.status = 'ARCHIVED';
          break;
        case 'DELETE':
          await prisma.notification.deleteMany({
            where: {
              id: { in: notificationIds },
              userId,
            },
          });
          return;
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: updateData,
      });
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de notificações
   */
  async getStats(userId: string): Promise<NotificationStats> {
    try {
      const [total, unread, byType, byPriority, recentActivity] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, status: 'UNREAD' } }),
        this.getNotificationsByType(userId),
        this.getNotificationsByPriority(userId),
        this.getRecentActivity(userId),
      ]);

      return {
        total,
        unread,
        byType,
        byPriority,
        recentActivity,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar preferências do usuário
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Criar preferências padrão
        preferences = await this.createDefaultPreferences(userId);
      }

      return {
        userId: preferences.userId,
        emailEnabled: preferences.emailEnabled,
        pushEnabled: preferences.pushEnabled,
        smsEnabled: preferences.smsEnabled,
        types: JSON.parse(preferences.types),
      };
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      throw error;
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await prisma.notificationPreferences.upsert({
        where: { userId },
        update: {
          emailEnabled: preferences.emailEnabled,
          pushEnabled: preferences.pushEnabled,
          smsEnabled: preferences.smsEnabled,
          types: preferences.types ? JSON.stringify(preferences.types) : undefined,
        },
        create: {
          userId,
          emailEnabled: preferences.emailEnabled ?? true,
          pushEnabled: preferences.pushEnabled ?? true,
          smsEnabled: preferences.smsEnabled ?? false,
          types: JSON.stringify(preferences.types || {}),
        },
      });

      return {
        userId: updated.userId,
        emailEnabled: updated.emailEnabled,
        pushEnabled: updated.pushEnabled,
        smsEnabled: updated.smsEnabled,
        types: JSON.parse(updated.types),
      };
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }

  /**
   * Entregar notificação através dos canais
   */
  private async deliverNotification(
    notification: any,
    preferences: NotificationPreferences
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    try {
      // Buscar dados do usuário
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o tipo de notificação está habilitado
      const typePreferences = preferences.types[notification.type];

      // Email
      if (preferences.emailEnabled && typePreferences?.email) {
        try {
          const emailResult = await emailService.sendNotificationEmail(
            user.email,
            notification
          );
          results.push({
            success: true,
            channel: 'email',
            messageId: emailResult.messageId,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            channel: 'email',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date(),
          });
        }
      }

      // Push Notification
      if (preferences.pushEnabled && typePreferences?.push) {
        try {
          await pushService.sendPushNotification({
            userId: notification.userId,
            title: notification.title,
            body: notification.message,
            data: {
              notificationId: notification.id,
              actionUrl: notification.actionUrl,
            },
          });
          results.push({
            success: true,
            channel: 'push',
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            channel: 'push',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date(),
          });
        }
      }

      // SMS
      if (preferences.smsEnabled && typePreferences?.sms && user.phone) {
        try {
          await smsService.sendSMS({
            to: user.phone,
            message: `${notification.title}: ${notification.message}`,
          });
          results.push({
            success: true,
            channel: 'sms',
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            channel: 'sms',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date(),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao entregar notificação:', error);
      return results;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private async getNotificationsByType(userId: string): Promise<Record<string, number>> {
    const result = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true },
    });

    return result.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getNotificationsByPriority(userId: string): Promise<Record<string, number>> {
    const result = await prisma.notification.groupBy({
      by: ['priority'],
      where: { userId },
      _count: { priority: true },
    });

    return result.reduce((acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getRecentActivity(userId: string): Promise<Array<{ date: string; count: number }>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const activityMap = new Map<string, number>();
    
    result.forEach(notification => {
      const date = notification.createdAt.toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    return Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private async createDefaultPreferences(userId: string): Promise<any> {
    const defaultTypes = notificationTemplateService.getDefaultTypePreferences();
    
    return await prisma.notificationPreferences.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        types: JSON.stringify(defaultTypes),
      },
    });
  }
}

export const notificationService = new NotificationService();
