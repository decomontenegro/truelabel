/**
 * Validation Queue Service
 * 
 * Purpose: Manage validation queue operations and assignments
 * Dependencies: Prisma Client, Event Emitter
 * 
 * Features:
 * - Queue management (create, assign, update status)
 * - Automatic assignment based on expertise
 * - Priority handling
 * - SLA tracking
 * - History logging
 */

import { User, ValidationQueue } from '@prisma/client';
import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma';
import { ValidationQueueStatus, ValidationQueuePriority } from '../types/enums';

interface QueueFilters {
  status?: ValidationQueueStatus;
  assignedToId?: string;
  category?: string;
  priority?: ValidationQueuePriority;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateQueueData {
  productId: string;
  requestedById: string;
  category: string;
  priority?: ValidationQueuePriority;
  estimatedDuration?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

interface QueueMetrics {
  totalPending: number;
  totalAssigned: number;
  totalInProgress: number;
  totalCompleted: number;
  avgProcessingTime: number;
  overdueCount: number;
  totalActive: number;
}

type AssignmentStrategy = 'ROUND_ROBIN' | 'EXPERTISE_BASED' | 'WORKLOAD_BALANCED';

class ValidationQueueService extends EventEmitter {
  private assignmentStrategies: Record<string, AssignmentStrategy> = {
    ROUND_ROBIN: 'ROUND_ROBIN',
    EXPERTISE_BASED: 'EXPERTISE_BASED',
    WORKLOAD_BALANCED: 'WORKLOAD_BALANCED'
  };

  constructor() {
    super();
  }

  /**
   * Create a new validation queue entry
   */
  async createQueueEntry(data: CreateQueueData): Promise<ValidationQueue> {
    try {
      const {
        productId,
        requestedById,
        category,
        priority = 'NORMAL',
        estimatedDuration = 60, // default 1 hour
        notes,
        metadata = {}
      } = data;

      // Calculate due date based on priority
      const dueDate = this.calculateDueDate(priority, estimatedDuration);

      const queueEntry = await prisma.validationQueue.create({
        data: {
          productId,
          requestedById,
          category,
          priority,
          estimatedDuration,
          dueDate,
          notes,
          metadata: JSON.stringify(metadata),
          status: 'PENDING'
        },
        include: {
          product: {
            include: {
              user: true
            }
          },
          requestedBy: true
        }
      });

      // Log the creation
      await this.logQueueAction(queueEntry.id, 'CREATED', null, 'PENDING', requestedById, 'Queue entry created');

      // Emit event for real-time updates
      this.emit('queueEntryCreated', queueEntry);

      // Try automatic assignment
      await this.tryAutoAssignment(queueEntry.id);

      return queueEntry;
    } catch (error) {
      throw new Error(`Failed to create queue entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get validation queue with filters
   */
  async getQueue(filters: QueueFilters = {}) {
    try {
      const {
        status,
        assignedToId,
        category,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const where: any = {};
      if (status) where.status = status;
      if (assignedToId) where.assignedToId = assignedToId;
      if (category) where.category = category;
      if (priority) where.priority = priority;

      const [queue, total] = await Promise.all([
        prisma.validationQueue.findMany({
          where,
          include: {
            product: {
              include: {
                user: true
              }
            },
            requestedBy: true,
            assignedTo: true
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.validationQueue.count({ where })
      ]);

      return {
        queue: queue.map(entry => ({
          ...entry,
          metadata: entry.metadata ? JSON.parse(entry.metadata as string) : {}
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign validation to a validator
   */
  async assignValidation(queueId: string, assignedToId: string, assignedById: string): Promise<ValidationQueue> {
    try {
      const queueEntry = await prisma.validationQueue.findUnique({
        where: { id: queueId },
        include: { assignedTo: true }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      if (queueEntry.status !== 'PENDING') {
        throw new Error('Queue entry is not in PENDING status');
      }

      const updatedEntry = await prisma.validationQueue.update({
        where: { id: queueId },
        data: {
          assignedToId,
          assignedAt: new Date(),
          status: 'ASSIGNED'
        },
        include: {
          product: {
            include: {
              user: true
            }
          },
          requestedBy: true,
          assignedTo: true
        }
      });

      // Log the assignment
      await this.logQueueAction(
        queueId,
        'ASSIGNED',
        'PENDING',
        'ASSIGNED',
        assignedById,
        `Assigned to ${updatedEntry.assignedTo?.name || 'Unknown'}`
      );

      // Emit event for real-time updates
      this.emit('queueEntryAssigned', updatedEntry);

      return updatedEntry;
    } catch (error) {
      throw new Error(`Failed to assign validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update queue entry status
   */
  async updateStatus(queueId: string, newStatus: ValidationQueueStatus, userId: string, reason: string | null = null): Promise<ValidationQueue> {
    try {
      const queueEntry = await prisma.validationQueue.findUnique({
        where: { id: queueId }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      const updateData: any = {
        status: newStatus
      };

      // Set timestamps based on status
      if (newStatus === 'IN_PROGRESS' && !queueEntry.startedAt) {
        updateData.startedAt = new Date();
      } else if (newStatus === 'COMPLETED' && !queueEntry.completedAt) {
        updateData.completedAt = new Date();
        
        // Calculate actual duration
        if (queueEntry.startedAt) {
          const duration = Math.round((new Date().getTime() - queueEntry.startedAt.getTime()) / (1000 * 60)); // minutes
          updateData.actualDuration = duration;
        }
      }

      const updatedEntry = await prisma.validationQueue.update({
        where: { id: queueId },
        data: updateData,
        include: {
          product: {
            include: {
              user: true
            }
          },
          requestedBy: true,
          assignedTo: true
        }
      });

      // Log the status change
      await this.logQueueAction(
        queueId,
        'STATUS_CHANGED',
        queueEntry.status,
        newStatus,
        userId,
        reason
      );

      // Emit event for real-time updates
      this.emit('queueEntryUpdated', updatedEntry);

      return updatedEntry;
    } catch (error) {
      throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      const [
        totalPending,
        totalAssigned,
        totalInProgress,
        totalCompleted,
        avgProcessingTime,
        overdueCount
      ] = await Promise.all([
        prisma.validationQueue.count({ where: { status: 'PENDING' } }),
        prisma.validationQueue.count({ where: { status: 'ASSIGNED' } }),
        prisma.validationQueue.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.validationQueue.count({ where: { status: 'COMPLETED' } }),
        this.getAverageProcessingTime(),
        this.getOverdueCount()
      ]);

      return {
        totalPending,
        totalAssigned,
        totalInProgress,
        totalCompleted,
        avgProcessingTime,
        overdueCount,
        totalActive: totalPending + totalAssigned + totalInProgress
      };
    } catch (error) {
      throw new Error(`Failed to get queue metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Try automatic assignment based on strategy
   */
  async tryAutoAssignment(queueId: string, strategy: AssignmentStrategy = 'EXPERTISE_BASED'): Promise<ValidationQueue | null> {
    try {
      const queueEntry = await prisma.validationQueue.findUnique({
        where: { id: queueId },
        include: {
          product: true
        }
      });

      if (!queueEntry || queueEntry.status !== 'PENDING') {
        return null;
      }

      // Get available validators
      const validators = await prisma.user.findMany({
        where: {
          role: 'ADMIN' // Validators have ADMIN role
        }
      });

      if (validators.length === 0) {
        return null;
      }

      let selectedValidator: User | undefined;

      switch (strategy) {
        case 'EXPERTISE_BASED':
          selectedValidator = await this.selectByExpertise(validators, queueEntry);
          break;
        case 'WORKLOAD_BALANCED':
          selectedValidator = await this.selectByWorkload(validators);
          break;
        case 'ROUND_ROBIN':
        default:
          selectedValidator = validators[0]; // Simple round-robin
          break;
      }

      if (selectedValidator) {
        return await this.assignValidation(queueId, selectedValidator.id, 'SYSTEM');
      }

      return null;
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      return null;
    }
  }

  /**
   * Calculate due date based on priority
   */
  private calculateDueDate(priority: ValidationQueuePriority, estimatedDuration: number): Date {
    const now = new Date();
    let hoursToAdd: number;

    switch (priority) {
      case 'URGENT':
        hoursToAdd = 4; // 4 hours
        break;
      case 'HIGH':
        hoursToAdd = 24; // 1 day
        break;
      case 'NORMAL':
        hoursToAdd = 72; // 3 days
        break;
      case 'LOW':
        hoursToAdd = 168; // 1 week
        break;
      default:
        hoursToAdd = 72;
    }

    return new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
  }

  /**
   * Log queue action for audit trail
   */
  private async logQueueAction(
    queueId: string, 
    action: string, 
    previousStatus: ValidationQueueStatus | null, 
    newStatus: ValidationQueueStatus, 
    performedById: string, 
    reason: string | null = null
  ): Promise<void> {
    try {
      await prisma.validationQueueHistory.create({
        data: {
          queueId,
          action,
          previousStatus,
          newStatus,
          performedById,
          reason,
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: 'system' // Could be enhanced to capture actual user agent
          })
        }
      });
    } catch (error) {
      console.error('Failed to log queue action:', error);
    }
  }

  /**
   * Get average processing time
   */
  private async getAverageProcessingTime(): Promise<number> {
    try {
      const completed = await prisma.validationQueue.findMany({
        where: {
          status: 'COMPLETED',
          actualDuration: { not: null }
        },
        select: {
          actualDuration: true
        }
      });

      if (completed.length === 0) return 0;

      const total = completed.reduce((sum, entry) => sum + (entry.actualDuration || 0), 0);
      return Math.round(total / completed.length);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get overdue count
   */
  private async getOverdueCount(): Promise<number> {
    try {
      return await prisma.validationQueue.count({
        where: {
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() }
        }
      });
    } catch (error) {
      return 0;
    }
  }

  /**
   * Select validator by expertise (placeholder - can be enhanced)
   */
  private async selectByExpertise(validators: User[], queueEntry: ValidationQueue): Promise<User> {
    // For now, return the first validator
    // This can be enhanced with expertise matching logic
    return validators[0];
  }

  /**
   * Select validator by workload
   */
  private async selectByWorkload(validators: User[]): Promise<User> {
    try {
      const workloads = await Promise.all(
        validators.map(async (validator) => {
          const activeCount = await prisma.validationQueue.count({
            where: {
              assignedToId: validator.id,
              status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            }
          });
          return { validator, activeCount };
        })
      );

      // Sort by workload (ascending) and return validator with least workload
      workloads.sort((a, b) => a.activeCount - b.activeCount);
      return workloads[0].validator;
    } catch (error) {
      return validators[0]; // Fallback to first validator
    }
  }
}

export default new ValidationQueueService();