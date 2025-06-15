/**
 * Validation Queue Controller
 *
 * Purpose: Handle HTTP requests for validation queue operations
 * Dependencies: Validation Queue Service, Authentication middleware
 *
 * Endpoints:
 * - GET /api/validations/queue - Get validation queue
 * - POST /api/validations/queue - Create queue entry
 * - PATCH /api/validations/queue/:id/assign - Assign validation
 * - PATCH /api/validations/queue/:id/status - Update status
 * - GET /api/validations/queue/metrics - Get queue metrics
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import validationQueueService from '../services/validationQueueService';
import { AuthRequest } from '../middleware/auth';
import { ValidationQueueStatus, ValidationQueuePriority } from '../types/enums';

interface QueueFilters {
  status?: ValidationQueueStatus;
  assignedToId?: string;
  category?: string;
  priority?: ValidationQueuePriority;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  requestedById?: string;
}

interface CreateQueueEntryData {
  productId: string;
  category: string;
  priority?: ValidationQueuePriority;
  estimatedDuration?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

class ValidationQueueController {
  /**
   * Get validation queue with filters
   * GET /api/validations/queue
   */
  async getQueue(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        status,
        assignedToId,
        category,
        priority,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as Record<string, string>;

      // For non-admin users, filter by their assignments or requests
      const filters: QueueFilters = {
        status: status as ValidationQueueStatus | undefined,
        category,
        priority: priority as ValidationQueuePriority | undefined,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      if (req.user?.role === 'ADMIN') {
        // Admins can see all or filter by assignedToId
        if (assignedToId) {
          filters.assignedToId = assignedToId;
        }
      } else if (req.user?.role === 'BRAND') {
        // Brands can only see their own requests
        filters.requestedById = req.user.id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const result = await validationQueueService.getQueue(filters);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get queue error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get validation queue',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new queue entry
   * POST /api/validations/queue
   */
  async createQueueEntry(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        productId,
        category,
        priority = 'NORMAL',
        estimatedDuration,
        notes,
        metadata
      }: CreateQueueEntryData = req.body;

      // Only brands can create queue entries for their products
      if (!req.user || req.user.role !== 'BRAND') {
        return res.status(403).json({
          success: false,
          message: 'Only brands can request validations'
        });
      }

      const queueEntry = await validationQueueService.createQueueEntry({
        productId,
        requestedById: req.user.id,
        category,
        priority: priority as ValidationQueuePriority | undefined,
        estimatedDuration,
        notes,
        metadata
      });

      return res.status(201).json({
        success: true,
        message: 'Validation request created successfully',
        data: queueEntry
      });
    } catch (error) {
      console.error('Create queue entry error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create validation request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Assign validation to validator
   * PATCH /api/validations/queue/:id/assign
   */
  async assignValidation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { assignedToId }: { assignedToId: string } = req.body;

      // Only admins can assign validations
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can assign validations'
        });
      }

      const updatedEntry = await validationQueueService.assignValidation(
        id,
        assignedToId,
        req.user.id
      );

      return res.json({
        success: true,
        message: 'Validation assigned successfully',
        data: updatedEntry
      });
    } catch (error) {
      console.error('Assign validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign validation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update queue entry status
   * PATCH /api/validations/queue/:id/status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { status, reason }: { status: string; reason?: string } = req.body;

      // Only admins can update status
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can update validation status'
        });
      }

      const updatedEntry = await validationQueueService.updateStatus(
        id,
        status as ValidationQueueStatus,
        req.user.id,
        reason
      );

      return res.json({
        success: true,
        message: 'Status updated successfully',
        data: updatedEntry
      });
    } catch (error) {
      console.error('Update status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue metrics
   * GET /api/validations/queue/metrics
   */
  async getMetrics(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // Only admins can view metrics
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const metrics = await validationQueueService.getQueueMetrics();

      return res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get queue metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue entry by ID
   * GET /api/validations/queue/:id
   */
  async getQueueEntry(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const queueEntry = await validationQueueService.getQueue({
        id,
        limit: 1
      } as any);

      if (!queueEntry.queue.length) {
        return res.status(404).json({
          success: false,
          message: 'Queue entry not found'
        });
      }

      const entry = queueEntry.queue[0];

      // Check permissions
      if (!req.user || (req.user.role !== 'ADMIN' &&
          entry.requestedById !== req.user.id &&
          entry.assignedToId !== req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Get queue entry error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get queue entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue history
   * GET /api/validations/queue/:id/history
   */
  async getQueueHistory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Only admins can view history
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // TODO: Implement getQueueHistory in service
      const history = [];

      return res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Get queue history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get queue history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cancel queue entry
   * DELETE /api/validations/queue/:id
   */
  async cancelQueueEntry(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason }: { reason?: string } = req.body;

      const updatedEntry = await validationQueueService.updateStatus(
        id,
        ValidationQueueStatus.FAILED,
        req.user!.id,
        reason || 'Cancelled by user'
      );

      return res.json({
        success: true,
        message: 'Queue entry cancelled successfully',
        data: updatedEntry
      });
    } catch (error) {
      console.error('Cancel queue entry error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel queue entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue metrics
   * GET /api/validations/queue/metrics
   */
  async getQueueMetrics(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const metrics = await validationQueueService.getQueueMetrics();
      return res.json(metrics);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return res.status(500).json({ error: 'Erro ao buscar métricas da fila' });
    }
  }
}

export default new ValidationQueueController();
