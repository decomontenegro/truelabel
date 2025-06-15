"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const prisma_1 = require("../lib/prisma");
class ValidationQueueService extends events_1.EventEmitter {
    constructor() {
        super();
        this.assignmentStrategies = {
            ROUND_ROBIN: 'ROUND_ROBIN',
            EXPERTISE_BASED: 'EXPERTISE_BASED',
            WORKLOAD_BALANCED: 'WORKLOAD_BALANCED'
        };
    }
    async createQueueEntry(data) {
        try {
            const { productId, requestedById, category, priority = 'NORMAL', estimatedDuration = 60, notes, metadata = {} } = data;
            const dueDate = this.calculateDueDate(priority, estimatedDuration);
            const queueEntry = await prisma_1.prisma.validationQueue.create({
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
            await this.logQueueAction(queueEntry.id, 'CREATED', null, 'PENDING', requestedById, 'Queue entry created');
            this.emit('queueEntryCreated', queueEntry);
            await this.tryAutoAssignment(queueEntry.id);
            return queueEntry;
        }
        catch (error) {
            throw new Error(`Failed to create queue entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQueue(filters = {}) {
        try {
            const { status, assignedToId, category, priority, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const where = {};
            if (status)
                where.status = status;
            if (assignedToId)
                where.assignedToId = assignedToId;
            if (category)
                where.category = category;
            if (priority)
                where.priority = priority;
            const [queue, total] = await Promise.all([
                prisma_1.prisma.validationQueue.findMany({
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
                prisma_1.prisma.validationQueue.count({ where })
            ]);
            return {
                queue: queue.map(entry => ({
                    ...entry,
                    metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to get queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async assignValidation(queueId, assignedToId, assignedById) {
        try {
            const queueEntry = await prisma_1.prisma.validationQueue.findUnique({
                where: { id: queueId },
                include: { assignedTo: true }
            });
            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }
            if (queueEntry.status !== 'PENDING') {
                throw new Error('Queue entry is not in PENDING status');
            }
            const updatedEntry = await prisma_1.prisma.validationQueue.update({
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
            await this.logQueueAction(queueId, 'ASSIGNED', 'PENDING', 'ASSIGNED', assignedById, `Assigned to ${updatedEntry.assignedTo?.name || 'Unknown'}`);
            this.emit('queueEntryAssigned', updatedEntry);
            return updatedEntry;
        }
        catch (error) {
            throw new Error(`Failed to assign validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateStatus(queueId, newStatus, userId, reason = null) {
        try {
            const queueEntry = await prisma_1.prisma.validationQueue.findUnique({
                where: { id: queueId }
            });
            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }
            const updateData = {
                status: newStatus
            };
            if (newStatus === 'IN_PROGRESS' && !queueEntry.startedAt) {
                updateData.startedAt = new Date();
            }
            else if (newStatus === 'COMPLETED' && !queueEntry.completedAt) {
                updateData.completedAt = new Date();
                if (queueEntry.startedAt) {
                    const duration = Math.round((new Date().getTime() - queueEntry.startedAt.getTime()) / (1000 * 60));
                    updateData.actualDuration = duration;
                }
            }
            const updatedEntry = await prisma_1.prisma.validationQueue.update({
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
            await this.logQueueAction(queueId, 'STATUS_CHANGED', queueEntry.status, newStatus, userId, reason);
            this.emit('queueEntryUpdated', updatedEntry);
            return updatedEntry;
        }
        catch (error) {
            throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getQueueMetrics() {
        try {
            const [totalPending, totalAssigned, totalInProgress, totalCompleted, avgProcessingTime, overdueCount] = await Promise.all([
                prisma_1.prisma.validationQueue.count({ where: { status: 'PENDING' } }),
                prisma_1.prisma.validationQueue.count({ where: { status: 'ASSIGNED' } }),
                prisma_1.prisma.validationQueue.count({ where: { status: 'IN_PROGRESS' } }),
                prisma_1.prisma.validationQueue.count({ where: { status: 'COMPLETED' } }),
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
        }
        catch (error) {
            throw new Error(`Failed to get queue metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async tryAutoAssignment(queueId, strategy = 'EXPERTISE_BASED') {
        try {
            const queueEntry = await prisma_1.prisma.validationQueue.findUnique({
                where: { id: queueId },
                include: {
                    product: true
                }
            });
            if (!queueEntry || queueEntry.status !== 'PENDING') {
                return null;
            }
            const validators = await prisma_1.prisma.user.findMany({
                where: {
                    role: 'ADMIN'
                }
            });
            if (validators.length === 0) {
                return null;
            }
            let selectedValidator;
            switch (strategy) {
                case 'EXPERTISE_BASED':
                    selectedValidator = await this.selectByExpertise(validators, queueEntry);
                    break;
                case 'WORKLOAD_BALANCED':
                    selectedValidator = await this.selectByWorkload(validators);
                    break;
                case 'ROUND_ROBIN':
                default:
                    selectedValidator = validators[0];
                    break;
            }
            if (selectedValidator) {
                return await this.assignValidation(queueId, selectedValidator.id, 'SYSTEM');
            }
            return null;
        }
        catch (error) {
            console.error('Auto-assignment failed:', error);
            return null;
        }
    }
    calculateDueDate(priority, estimatedDuration) {
        const now = new Date();
        let hoursToAdd;
        switch (priority) {
            case 'URGENT':
                hoursToAdd = 4;
                break;
            case 'HIGH':
                hoursToAdd = 24;
                break;
            case 'NORMAL':
                hoursToAdd = 72;
                break;
            case 'LOW':
                hoursToAdd = 168;
                break;
            default:
                hoursToAdd = 72;
        }
        return new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
    }
    async logQueueAction(queueId, action, previousStatus, newStatus, performedById, reason = null) {
        try {
            await prisma_1.prisma.validationQueueHistory.create({
                data: {
                    queueId,
                    action,
                    previousStatus,
                    newStatus,
                    performedById,
                    reason,
                    metadata: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        userAgent: 'system'
                    })
                }
            });
        }
        catch (error) {
            console.error('Failed to log queue action:', error);
        }
    }
    async getAverageProcessingTime() {
        try {
            const completed = await prisma_1.prisma.validationQueue.findMany({
                where: {
                    status: 'COMPLETED',
                    actualDuration: { not: null }
                },
                select: {
                    actualDuration: true
                }
            });
            if (completed.length === 0)
                return 0;
            const total = completed.reduce((sum, entry) => sum + (entry.actualDuration || 0), 0);
            return Math.round(total / completed.length);
        }
        catch (error) {
            return 0;
        }
    }
    async getOverdueCount() {
        try {
            return await prisma_1.prisma.validationQueue.count({
                where: {
                    status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
                    dueDate: { lt: new Date() }
                }
            });
        }
        catch (error) {
            return 0;
        }
    }
    async selectByExpertise(validators, queueEntry) {
        return validators[0];
    }
    async selectByWorkload(validators) {
        try {
            const workloads = await Promise.all(validators.map(async (validator) => {
                const activeCount = await prisma_1.prisma.validationQueue.count({
                    where: {
                        assignedToId: validator.id,
                        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
                    }
                });
                return { validator, activeCount };
            }));
            workloads.sort((a, b) => a.activeCount - b.activeCount);
            return workloads[0].validator;
        }
        catch (error) {
            return validators[0];
        }
    }
}
exports.default = new ValidationQueueService();
//# sourceMappingURL=validationQueueService.js.map