"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const client_1 = require("@prisma/client");
const events_1 = require("events");
const notificationTemplateService_1 = require("./notificationTemplateService");
const emailService_1 = require("./emailService");
const pushService_1 = require("./pushService");
const smsService_1 = require("./smsService");
const prisma = new client_1.PrismaClient();
class NotificationService extends events_1.EventEmitter {
    constructor() {
        super();
    }
    async createNotification(data) {
        try {
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
            const preferences = await this.getUserPreferences(data.userId);
            await this.deliverNotification(notification, preferences);
            this.emit('notification:created', {
                type: 'NEW_NOTIFICATION',
                notification,
                userId: data.userId,
                timestamp: new Date(),
            });
            return notification;
        }
        catch (error) {
            console.error('Erro ao criar notificação:', error);
            throw error;
        }
    }
    async getNotifications(filters) {
        try {
            const { userId, status, type, priority, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const where = {};
            if (userId)
                where.userId = userId;
            if (status?.length)
                where.status = { in: status };
            if (type?.length)
                where.type = { in: type };
            if (priority?.length)
                where.priority = { in: priority };
            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom)
                    where.createdAt.gte = dateFrom;
                if (dateTo)
                    where.createdAt.lte = dateTo;
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
        }
        catch (error) {
            console.error('Erro ao buscar notificações:', error);
            throw error;
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            const notification = await prisma.notification.update({
                where: {
                    id: notificationId,
                    userId,
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
            });
            return notification;
        }
        catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            throw error;
        }
    }
    async bulkAction(action) {
        try {
            const { action: actionType, notificationIds, userId } = action;
            const updateData = {};
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
        }
        catch (error) {
            console.error('Erro na ação em lote:', error);
            throw error;
        }
    }
    async getStats(userId) {
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
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
    async getUserPreferences(userId) {
        try {
            let preferences = await prisma.notificationPreferences.findUnique({
                where: { userId },
            });
            if (!preferences) {
                preferences = await this.createDefaultPreferences(userId);
            }
            return {
                userId: preferences.userId,
                emailEnabled: preferences.emailEnabled,
                pushEnabled: preferences.pushEnabled,
                smsEnabled: preferences.smsEnabled,
                types: JSON.parse(preferences.types),
            };
        }
        catch (error) {
            console.error('Erro ao buscar preferências:', error);
            throw error;
        }
    }
    async updateUserPreferences(userId, preferences) {
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
        }
        catch (error) {
            console.error('Erro ao atualizar preferências:', error);
            throw error;
        }
    }
    async deliverNotification(notification, preferences) {
        const results = [];
        try {
            const user = await prisma.user.findUnique({
                where: { id: notification.userId },
            });
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            const typePreferences = preferences.types[notification.type];
            if (preferences.emailEnabled && typePreferences?.email) {
                try {
                    const emailResult = await emailService_1.emailService.sendNotificationEmail(user.email, notification);
                    results.push({
                        success: true,
                        channel: 'email',
                        messageId: emailResult.messageId,
                        timestamp: new Date(),
                    });
                }
                catch (error) {
                    results.push({
                        success: false,
                        channel: 'email',
                        error: error instanceof Error ? error.message : 'Erro desconhecido',
                        timestamp: new Date(),
                    });
                }
            }
            if (preferences.pushEnabled && typePreferences?.push) {
                try {
                    await pushService_1.pushService.sendPushNotification({
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
                }
                catch (error) {
                    results.push({
                        success: false,
                        channel: 'push',
                        error: error instanceof Error ? error.message : 'Erro desconhecido',
                        timestamp: new Date(),
                    });
                }
            }
            if (preferences.smsEnabled && typePreferences?.sms && user.phone) {
                try {
                    await smsService_1.smsService.sendSMS({
                        to: user.phone,
                        message: `${notification.title}: ${notification.message}`,
                    });
                    results.push({
                        success: true,
                        channel: 'sms',
                        timestamp: new Date(),
                    });
                }
                catch (error) {
                    results.push({
                        success: false,
                        channel: 'sms',
                        error: error instanceof Error ? error.message : 'Erro desconhecido',
                        timestamp: new Date(),
                    });
                }
            }
            return results;
        }
        catch (error) {
            console.error('Erro ao entregar notificação:', error);
            return results;
        }
    }
    async getNotificationsByType(userId) {
        const result = await prisma.notification.groupBy({
            by: ['type'],
            where: { userId },
            _count: { type: true },
        });
        return result.reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
        }, {});
    }
    async getNotificationsByPriority(userId) {
        const result = await prisma.notification.groupBy({
            by: ['priority'],
            where: { userId },
            _count: { priority: true },
        });
        return result.reduce((acc, item) => {
            acc[item.priority] = item._count.priority;
            return acc;
        }, {});
    }
    async getRecentActivity(userId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const result = await prisma.notification.findMany({
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true },
        });
        const activityMap = new Map();
        result.forEach(notification => {
            const date = notification.createdAt.toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + 1);
        });
        return Array.from(activityMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));
    }
    async createDefaultPreferences(userId) {
        const defaultTypes = notificationTemplateService_1.notificationTemplateService.getDefaultTypePreferences();
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
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map