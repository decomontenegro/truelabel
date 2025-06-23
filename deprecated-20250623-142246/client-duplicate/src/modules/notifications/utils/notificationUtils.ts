/**
 * Notification Utilities
 * 
 * Funções utilitárias para o módulo de notificações
 */

import type {
  BaseNotification,
  NotificationType,
  NotificationPriority,
  NotificationTemplate
} from '../types';

class NotificationUtils {
  /**
   * Formatar título da notificação baseado no tipo
   */
  formatTitle(type: NotificationType, data?: Record<string, any>): string {
    const templates: Record<NotificationType, string> = {
      VALIDATION_COMPLETED: 'Validação concluída',
      VALIDATION_REJECTED: 'Validação rejeitada',
      PRODUCT_APPROVED: 'Produto aprovado',
      PRODUCT_REJECTED: 'Produto rejeitado',
      REPORT_UPLOADED: 'Relatório enviado',
      QR_CODE_GENERATED: 'QR Code gerado',
      LABORATORY_ASSIGNED: 'Laboratório atribuído',
      DEADLINE_APPROACHING: 'Prazo se aproximando',
      SYSTEM_MAINTENANCE: 'Manutenção do sistema',
      SECURITY_ALERT: 'Alerta de segurança',
      PAYMENT_REQUIRED: 'Pagamento necessário',
      SUBSCRIPTION_EXPIRING: 'Assinatura expirando',
    };

    let title = templates[type];

    // Personalizar com dados específicos
    if (data?.productName) {
      title += ` - ${data.productName}`;
    }

    return title;
  }

  /**
   * Formatar mensagem da notificação
   */
  formatMessage(type: NotificationType, data?: Record<string, any>): string {
    const templates: Record<NotificationType, string> = {
      VALIDATION_COMPLETED: 'Sua validação foi concluída com sucesso.',
      VALIDATION_REJECTED: 'Sua validação foi rejeitada. Verifique os detalhes.',
      PRODUCT_APPROVED: 'Seu produto foi aprovado e está disponível.',
      PRODUCT_REJECTED: 'Seu produto foi rejeitado. Revise as informações.',
      REPORT_UPLOADED: 'Um novo relatório foi enviado para análise.',
      QR_CODE_GENERATED: 'QR Code foi gerado com sucesso.',
      LABORATORY_ASSIGNED: 'Um laboratório foi atribuído ao seu produto.',
      DEADLINE_APPROACHING: 'O prazo para validação está se aproximando.',
      SYSTEM_MAINTENANCE: 'Manutenção programada do sistema.',
      SECURITY_ALERT: 'Atividade suspeita detectada em sua conta.',
      PAYMENT_REQUIRED: 'Pagamento pendente para continuar o serviço.',
      SUBSCRIPTION_EXPIRING: 'Sua assinatura expira em breve.',
    };

    let message = templates[type];

    // Personalizar com dados específicos
    if (data) {
      message = this.interpolateTemplate(message, data);
    }

    return message;
  }

  /**
   * Determinar prioridade baseada no tipo
   */
  getPriorityByType(type: NotificationType): NotificationPriority {
    const priorityMap: Record<NotificationType, NotificationPriority> = {
      VALIDATION_COMPLETED: 'MEDIUM',
      VALIDATION_REJECTED: 'HIGH',
      PRODUCT_APPROVED: 'MEDIUM',
      PRODUCT_REJECTED: 'HIGH',
      REPORT_UPLOADED: 'LOW',
      QR_CODE_GENERATED: 'LOW',
      LABORATORY_ASSIGNED: 'MEDIUM',
      DEADLINE_APPROACHING: 'HIGH',
      SYSTEM_MAINTENANCE: 'MEDIUM',
      SECURITY_ALERT: 'URGENT',
      PAYMENT_REQUIRED: 'HIGH',
      SUBSCRIPTION_EXPIRING: 'HIGH',
    };

    return priorityMap[type];
  }

  /**
   * Gerar URL de ação baseada no tipo e dados
   */
  generateActionUrl(type: NotificationType, data?: Record<string, any>): string | undefined {
    const baseUrl = '/dashboard';

    switch (type) {
      case 'VALIDATION_COMPLETED':
      case 'VALIDATION_REJECTED':
        return data?.validationId ? `${baseUrl}/validations/${data.validationId}` : undefined;
      
      case 'PRODUCT_APPROVED':
      case 'PRODUCT_REJECTED':
        return data?.productId ? `${baseUrl}/products/${data.productId}` : undefined;
      
      case 'REPORT_UPLOADED':
        return data?.reportId ? `${baseUrl}/reports/${data.reportId}` : undefined;
      
      case 'QR_CODE_GENERATED':
        return data?.productId ? `${baseUrl}/qr-codes?product=${data.productId}` : undefined;
      
      case 'LABORATORY_ASSIGNED':
        return data?.laboratoryId ? `${baseUrl}/laboratories/${data.laboratoryId}` : undefined;
      
      case 'DEADLINE_APPROACHING':
        return `${baseUrl}/validations`;
      
      case 'PAYMENT_REQUIRED':
        return `${baseUrl}/billing`;
      
      case 'SUBSCRIPTION_EXPIRING':
        return `${baseUrl}/subscription`;
      
      default:
        return undefined;
    }
  }

  /**
   * Interpolar template com dados
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Agrupar notificações por data
   */
  groupByDate(notifications: BaseNotification[]): Record<string, BaseNotification[]> {
    const groups: Record<string, BaseNotification[]> = {};

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return groups;
  }

  /**
   * Filtrar notificações por critérios
   */
  filterNotifications(
    notifications: BaseNotification[],
    criteria: {
      search?: string;
      types?: NotificationType[];
      priorities?: NotificationPriority[];
      unreadOnly?: boolean;
    }
  ): BaseNotification[] {
    return notifications.filter(notification => {
      // Filtro de busca
      if (criteria.search) {
        const searchLower = criteria.search.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro por tipos
      if (criteria.types?.length && !criteria.types.includes(notification.type)) {
        return false;
      }

      // Filtro por prioridades
      if (criteria.priorities?.length && !criteria.priorities.includes(notification.priority)) {
        return false;
      }

      // Filtro apenas não lidas
      if (criteria.unreadOnly && notification.status !== 'UNREAD') {
        return false;
      }

      return true;
    });
  }

  /**
   * Ordenar notificações
   */
  sortNotifications(
    notifications: BaseNotification[],
    sortBy: 'date' | 'priority' | 'type' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): BaseNotification[] {
    const sorted = [...notifications].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Calcular estatísticas de notificações
   */
  calculateStats(notifications: BaseNotification[]) {
    const total = notifications.length;
    const unread = notifications.filter(n => n.status === 'UNREAD').length;
    
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {} as Record<NotificationPriority, number>);

    return {
      total,
      unread,
      readPercentage: total > 0 ? ((total - unread) / total) * 100 : 0,
      byType,
      byPriority,
    };
  }

  /**
   * Validar dados de notificação
   */
  validateNotificationData(data: Partial<BaseNotification>): string[] {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Título é obrigatório');
    }

    if (!data.message?.trim()) {
      errors.push('Mensagem é obrigatória');
    }

    if (!data.type) {
      errors.push('Tipo é obrigatório');
    }

    if (!data.userId) {
      errors.push('ID do usuário é obrigatório');
    }

    return errors;
  }
}

export const notificationUtils = new NotificationUtils();
