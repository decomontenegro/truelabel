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
  }

  async getTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    userId?: string;
  }): Promise<SupportTicket[]> {
    const response = await api.get<SupportTicket[]>('/support/tickets', { params: filters });
    return response.data;
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const response = await api.get<SupportTicket>(`/support/tickets/${ticketId}`);
    return response.data;
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
    const response = await api.post('/support/whatsapp/send', {
      phoneNumber,
      message,
      templateName
    });
    
    return response.data;
  }

  async getWhatsAppTemplates(): Promise<any[]> {
    const response = await api.get('/support/whatsapp/templates');
    return response.data;
  }

  async configureWhatsApp(config: WhatsAppConfig): Promise<void> {
    await api.post('/support/whatsapp/configure', config);
  }

  async getWhatsAppStatus(): Promise<{
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
  }> {
    const response = await api.get('/support/whatsapp/status');
    return response.data;
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
    const response = await api.get('/support/analytics', {
      params: dateRange
    });
    return response.data;
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