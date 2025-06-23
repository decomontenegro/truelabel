import { api } from './api';

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  productCode?: string;
  orderNumber?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  message: string;
  author: string;
  authorRole: 'user' | 'support' | 'admin';
  createdAt: Date;
  attachments?: string[];
}

export interface CreateTicketData {
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  productCode?: string;
  orderNumber?: string;
  userEmail?: string;
  attachments?: File[];
}

export interface WhatsAppConfig {
  businessId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
}

class SupportService {
  // Support Tickets
  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'attachments') {
          formData.append(key, value.toString());
        }
      });

      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post<SupportTicket>('/support/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    } catch (error: any) {
      // Fallback to mock service when API is not available
      console.warn('Support API not available, using mock service');
      return this.createMockTicket(data);
    }
  }

  // Mock ticket creation for when API is not available
  private async createMockTicket(data: CreateTicketData): Promise<SupportTicket> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      description: data.description,
      status: 'open',
      productCode: data.productCode,
      orderNumber: data.orderNumber,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      attachments: data.attachments?.map(f => f.name) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: []
    };

    // Store in localStorage for demo purposes
    const existingTickets = JSON.parse(localStorage.getItem('mockSupportTickets') || '[]');
    existingTickets.push(mockTicket);
    localStorage.setItem('mockSupportTickets', JSON.stringify(existingTickets));

    return mockTicket;
  }

  async getTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    userId?: string;
  }): Promise<SupportTicket[]> {
    try {
      const response = await api.get<SupportTicket[]>('/support/tickets', { params: filters });
      return response.data;
    } catch (error: any) {
      console.warn('Support API not available, using mock data');
      return this.getMockTickets();
    }
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const response = await api.get<SupportTicket>(`/support/tickets/${ticketId}`);
      return response.data;
    } catch (error: any) {
      console.warn('Support API not available, using mock data');
      const tickets = this.getMockTickets();
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      return ticket;
    }
  }

  private getMockTickets(): SupportTicket[] {
    const stored = localStorage.getItem('mockSupportTickets');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default mock tickets
    const mockTickets: SupportTicket[] = [
      {
        id: 'ticket-1',
        subject: 'Problema com validação de produto',
        category: 'technical',
        priority: 'high',
        description: 'Não consigo validar meu produto orgânico',
        status: 'open',
        productCode: 'ORG-001',
        userId: 'user-1',
        userEmail: 'usuario@exemplo.com',
        userName: 'Usuário Exemplo',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        responses: []
      },
      {
        id: 'ticket-2',
        subject: 'Dúvida sobre QR Code',
        category: 'quality',
        priority: 'medium',
        description: 'Como gerar QR Code para meu produto?',
        status: 'resolved',
        userId: 'user-2',
        userEmail: 'marca@exemplo.com',
        userName: 'Marca Exemplo',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        responses: [
          {
            id: 'response-1',
            ticketId: 'ticket-2',
            message: 'Para gerar um QR Code, acesse a página do produto e clique em "Gerar QR Code".',
            author: 'Suporte True Label',
            authorRole: 'support',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];

    localStorage.setItem('mockSupportTickets', JSON.stringify(mockTickets));
    return mockTickets;
  }

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const response = await api.put<SupportTicket>(`/support/tickets/${ticketId}`, updates);
    return response.data;
  }

  async addTicketResponse(ticketId: string, message: string, attachments?: File[]): Promise<TicketResponse> {
    const formData = new FormData();
    formData.append('message', message);
    
    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post<TicketResponse>(
      `/support/tickets/${ticketId}/responses`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return response.data;
  }

  // WhatsApp Integration
  async sendWhatsAppMessage(phoneNumber: string, message: string, templateName?: string): Promise<any> {
    try {
      const response = await api.post('/support/whatsapp/send', {
        phoneNumber,
        message,
        templateName
      });
      return response.data;
    } catch (error: any) {
      console.warn('WhatsApp API not available, using mock response');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, messageId: `mock-${Date.now()}`, message: 'Mensagem enviada (simulação)' };
    }
  }

  async getWhatsAppTemplates(): Promise<any[]> {
    try {
      const response = await api.get('/support/whatsapp/templates');
      return response.data;
    } catch (error: any) {
      console.warn('WhatsApp templates API not available, using mock data');
      return [
        { id: '1', name: 'welcome', content: 'Bem-vindo ao True Label!' },
        { id: '2', name: 'support', content: 'Como podemos ajudar você?' }
      ];
    }
  }

  async configureWhatsApp(config: WhatsAppConfig): Promise<void> {
    try {
      await api.post('/support/whatsapp/configure', config);
    } catch (error: any) {
      console.warn('WhatsApp configuration API not available, using mock response');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async getWhatsAppStatus(): Promise<{
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
  }> {
    try {
      const response = await api.get('/support/whatsapp/status');
      return response.data;
    } catch (error: any) {
      console.warn('WhatsApp status API not available, using mock data');
      return {
        connected: false,
        phoneNumber: '+55 11 99999-9999',
        businessName: 'True Label Demo'
      };
    }
  }

  // FAQ Management
  async getFAQs(category?: string, productId?: string): Promise<any[]> {
    const response = await api.get('/support/faqs', {
      params: { category, productId }
    });
    return response.data;
  }

  async createFAQ(data: {
    question: string;
    answer: string;
    category: string;
    relatedProducts?: string[];
  }): Promise<any> {
    const response = await api.post('/support/faqs', data);
    return response.data;
  }

  async updateFAQ(faqId: string, updates: any): Promise<any> {
    const response = await api.put(`/support/faqs/${faqId}`, updates);
    return response.data;
  }

  async deleteFAQ(faqId: string): Promise<void> {
    await api.delete(`/support/faqs/${faqId}`);
  }

  // Analytics
  async getSupportAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalTickets: number;
    openTickets: number;
    avgResponseTime: number;
    satisfactionRate: number;
    ticketsByCategory: Record<string, number>;
    ticketsByPriority: Record<string, number>;
  }> {
    try {
      const response = await api.get('/support/analytics', {
        params: dateRange
      });
      return response.data;
    } catch (error: any) {
      console.warn('Support analytics API not available, using mock data');
      return this.getMockAnalytics();
    }
  }

  private getMockAnalytics() {
    const tickets = this.getMockTickets();

    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'open').length,
      avgResponseTime: 4.5, // hours
      satisfactionRate: 92.5, // percentage
      ticketsByCategory: {
        technical: tickets.filter(t => t.category === 'technical').length,
        quality: tickets.filter(t => t.category === 'quality').length,
        delivery: tickets.filter(t => t.category === 'delivery').length,
        warranty: tickets.filter(t => t.category === 'warranty').length,
        counterfeit: tickets.filter(t => t.category === 'counterfeit').length,
        authentication: tickets.filter(t => t.category === 'authentication').length,
        other: tickets.filter(t => t.category === 'other').length
      },
      ticketsByPriority: {
        low: tickets.filter(t => t.priority === 'low').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        high: tickets.filter(t => t.priority === 'high').length
      }
    };
  }

  // Chat History
  async getChatHistory(userId?: string, limit = 50): Promise<any[]> {
    const response = await api.get('/support/chat/history', {
      params: { userId, limit }
    });
    return response.data;
  }

  async saveChatMessage(message: {
    text: string;
    sender: 'user' | 'bot';
    userId?: string;
    sessionId: string;
  }): Promise<void> {
    await api.post('/support/chat/messages', message);
  }
}

export const supportService = new SupportService();