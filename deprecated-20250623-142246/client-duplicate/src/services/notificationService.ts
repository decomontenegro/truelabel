import api from './api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  userId: string;
  data?: any;
}

interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: string;
  data?: any;
}

export const notificationService = {
  // Listar notificações do usuário
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      // Retornar notificações mock para desenvolvimento
      return {
        notifications: [
          {
            id: '1',
            title: 'Produto Validado',
            message: 'Seu produto "Whey Protein Premium" foi validado com sucesso!',
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
            userId: 'user-1',
            data: { productId: 'product-1' }
          },
          {
            id: '2',
            title: 'Novo Relatório',
            message: 'Um novo relatório foi enviado pelo laboratório XYZ.',
            type: 'info',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            userId: 'user-1',
            data: { reportId: 'report-1' }
          },
          {
            id: '3',
            title: 'QR Code Gerado',
            message: 'QR Code gerado para o produto "Iogurte Grego Natural".',
            type: 'success',
            read: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            userId: 'user-1',
            data: { productId: 'product-2' }
          }
        ]
      };
    }
  },

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      // Simular sucesso para desenvolvimento
    }
  },

  // Marcar todas como lidas
  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch (error) {
      // Simular sucesso para desenvolvimento
    }
  },

  // Criar notificação (admin)
  async createNotification(data: CreateNotificationData): Promise<{ notification: Notification }> {
    try {
      const response = await api.post('/notifications', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Deletar notificação
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      // Simular sucesso para desenvolvimento
    }
  },

  // Obter contagem de não lidas
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      // Retornar contagem mock
      return { count: 2 };
    }
  },

  // Notificações automáticas do sistema
  async notifyProductValidated(productId: string, status: string): Promise<void> {
    const messages = {
      APPROVED: 'Seu produto foi validado com sucesso! Agora você pode gerar QR Codes.',
      REJECTED: 'Seu produto foi rejeitado na validação. Verifique os detalhes.',
      PARTIAL: 'Seu produto foi parcialmente validado. Alguns claims precisam de revisão.'
    };

    const types = {
      APPROVED: 'success' as const,
      REJECTED: 'error' as const,
      PARTIAL: 'warning' as const
    };

    try {
      await this.createNotification({
        title: 'Status de Validação Atualizado',
        message: messages[status as keyof typeof messages] || 'Status do produto atualizado.',
        type: types[status as keyof typeof types] || 'info',
        data: { productId, status }
      });
    } catch (error) {
    }
  },

  async notifyNewReport(reportId: string, laboratoryName: string): Promise<void> {
    try {
      await this.createNotification({
        title: 'Novo Relatório Recebido',
        message: `Um novo relatório foi enviado pelo laboratório ${laboratoryName}.`,
        type: 'info',
        data: { reportId, laboratoryName }
      });
    } catch (error) {
    }
  },

  async notifyQRCodeGenerated(productId: string, productName: string): Promise<void> {
    try {
      await this.createNotification({
        title: 'QR Code Gerado',
        message: `QR Code gerado com sucesso para o produto "${productName}".`,
        type: 'success',
        data: { productId, productName }
      });
    } catch (error) {
    }
  },

  // Formatação de notificações
  formatNotificationTime(createdAt: string): string {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d atrás`;
    }
  },

  // Obter ícone da notificação
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  },

  // Obter cor da notificação
  getNotificationColor(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  },

  // Simular notificações em tempo real (para desenvolvimento)
  simulateRealTimeNotifications(): void {
    // Simular notificação a cada 30 segundos
    setInterval(() => {
      const randomNotifications = [
        {
          title: 'Novo Acesso QR Code',
          message: 'Seu produto foi escaneado por um consumidor.',
          type: 'info' as const
        },
        {
          title: 'Relatório Processado',
          message: 'Relatório laboratorial foi processado com sucesso.',
          type: 'success' as const
        },
        {
          title: 'Validação Pendente',
          message: 'Há uma validação aguardando sua análise.',
          type: 'warning' as const
        }
      ];

      const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
      
      // Disparar evento customizado para componentes escutarem
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: {
          id: Date.now().toString(),
          ...randomNotification,
          read: false,
          createdAt: new Date().toISOString(),
          userId: 'current-user'
        }
      }));
    }, 30000); // 30 segundos
  }
};

export default notificationService;
