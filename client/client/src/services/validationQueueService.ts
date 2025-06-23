/**
 * Validation Queue Service (Frontend)
 * 
 * Purpose: Handle validation queue API calls from frontend
 * Dependencies: API client, Types
 * 
 * Features:
 * - Queue management operations
 * - Real-time data fetching
 * - Error handling
 * - Type safety
 */

import { api } from './api';

export interface QueueEntry {
  id: string;
  productId: string;
  requestedById: string;
  assignedToId?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  estimatedDuration?: number;
  actualDuration?: number;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface QueueMetrics {
  totalPending: number;
  totalAssigned: number;
  totalInProgress: number;
  totalCompleted: number;
  avgProcessingTime: number;
  overdueCount: number;
  totalActive: number;
}

export interface QueueFilters {
  status?: string;
  assignedToId?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueueResponse {
  queue: QueueEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateQueueEntryData {
  productId: string;
  category: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedDuration?: number;
  notes?: string;
  metadata?: any;
}

class ValidationQueueService {
  /**
   * Get validation queue with filters
   */
  async getQueue(filters: QueueFilters = {}): Promise<{ success: boolean; data: QueueResponse }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/validations/queue?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get validation queue:', error);
      throw new Error(error.response?.data?.message || 'Failed to get validation queue');
    }
  }

  /**
   * Create new validation queue entry
   */
  async createQueueEntry(data: CreateQueueEntryData): Promise<{ success: boolean; data: QueueEntry }> {
    try {
      const response = await api.post('/validations/queue', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create queue entry:', error);
      throw new Error(error.response?.data?.message || 'Failed to create validation request');
    }
  }

  /**
   * Get queue metrics
   */
  async getMetrics(): Promise<{ success: boolean; data: QueueMetrics }> {
    try {
      const response = await api.get('/validations/queue/metrics');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get queue metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to get queue metrics');
    }
  }

  /**
   * Get specific queue entry
   */
  async getQueueEntry(id: string): Promise<{ success: boolean; data: QueueEntry }> {
    try {
      const response = await api.get(`/validations/queue/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get queue entry:', error);
      throw new Error(error.response?.data?.message || 'Failed to get queue entry');
    }
  }

  /**
   * Assign validation to validator
   */
  async assignValidation(queueId: string, assignedToId: string): Promise<{ success: boolean; data: QueueEntry }> {
    try {
      const response = await api.patch(`/validations/queue/${queueId}/assign`, {
        assignedToId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to assign validation:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign validation');
    }
  }

  /**
   * Update queue entry status
   */
  async updateStatus(queueId: string, status: string, reason?: string): Promise<{ success: boolean; data: QueueEntry }> {
    try {
      const response = await api.patch(`/validations/queue/${queueId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update status');
    }
  }

  /**
   * Get queue history
   */
  async getQueueHistory(queueId: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get(`/validations/queue/${queueId}/history`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get queue history:', error);
      throw new Error(error.response?.data?.message || 'Failed to get queue history');
    }
  }

  /**
   * Cancel queue entry
   */
  async cancelQueueEntry(queueId: string, reason?: string): Promise<{ success: boolean; data: QueueEntry }> {
    try {
      const response = await api.delete(`/validations/queue/${queueId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel queue entry:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel queue entry');
    }
  }

  /**
   * Get available validators for assignment
   */
  async getAvailableValidators(): Promise<{ success: boolean; data: any[] }> {
    try {
      // This would typically be a separate endpoint
      // For now, we'll use the users endpoint with role filter
      const response = await api.get('/users?role=ADMIN&active=true');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get available validators:', error);
      throw new Error(error.response?.data?.message || 'Failed to get available validators');
    }
  }

  /**
   * Get queue statistics for dashboard
   */
  async getQueueStatistics(period: 'day' | 'week' | 'month' = 'week'): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.get(`/validations/queue/statistics?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get queue statistics:', error);
      // Return mock data for development
      return {
        success: true,
        data: {
          totalProcessed: 0,
          averageTime: 0,
          completionRate: 0,
          trendData: []
        }
      };
    }
  }

  /**
   * Bulk assign validations
   */
  async bulkAssign(queueIds: string[], assignedToId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.post('/validations/queue/bulk-assign', {
        queueIds,
        assignedToId
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk assign validations:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk assign validations');
    }
  }

  /**
   * Bulk update status
   */
  async bulkUpdateStatus(queueIds: string[], status: string, reason?: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.post('/validations/queue/bulk-status', {
        queueIds,
        status,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk update status:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk update status');
    }
  }

  /**
   * Get queue entry comments/notes
   */
  async getQueueComments(queueId: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get(`/validations/queue/${queueId}/comments`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get queue comments:', error);
      return { success: true, data: [] }; // Return empty array for development
    }
  }

  /**
   * Add comment to queue entry
   */
  async addQueueComment(queueId: string, comment: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.post(`/validations/queue/${queueId}/comments`, {
        comment
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to add queue comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  /**
   * Export queue data
   */
  async exportQueue(filters: QueueFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      params.append('format', format);

      const response = await api.get(`/validations/queue/export?${params.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to export queue:', error);
      throw new Error(error.response?.data?.message || 'Failed to export queue data');
    }
  }
}

export const validationQueueService = new ValidationQueueService();
