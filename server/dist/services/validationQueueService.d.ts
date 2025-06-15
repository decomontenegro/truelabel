import { ValidationQueue } from '@prisma/client';
import { EventEmitter } from 'events';
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
declare class ValidationQueueService extends EventEmitter {
    private assignmentStrategies;
    constructor();
    createQueueEntry(data: CreateQueueData): Promise<ValidationQueue>;
    getQueue(filters?: QueueFilters): Promise<{
        queue: {
            metadata: any;
            product: {
                user: {
                    id: string;
                    email: string;
                    password: string;
                    name: string;
                    role: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                status: string;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                brand: string;
                category: string;
                description: string | null;
                sku: string;
                batchNumber: string | null;
                nutritionalInfo: string | null;
                claims: string | null;
                imageUrl: string | null;
                qrCode: string | null;
            };
            requestedBy: {
                id: string;
                email: string;
                password: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
            assignedTo: {
                id: string;
                email: string;
                password: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            notes: string | null;
            productId: string;
            priority: string;
            requestedById: string;
            assignedToId: string | null;
            estimatedDuration: number | null;
            actualDuration: number | null;
            assignedAt: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            dueDate: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    assignValidation(queueId: string, assignedToId: string, assignedById: string): Promise<ValidationQueue>;
    updateStatus(queueId: string, newStatus: ValidationQueueStatus, userId: string, reason?: string | null): Promise<ValidationQueue>;
    getQueueMetrics(): Promise<QueueMetrics>;
    tryAutoAssignment(queueId: string, strategy?: AssignmentStrategy): Promise<ValidationQueue | null>;
    private calculateDueDate;
    private logQueueAction;
    private getAverageProcessingTime;
    private getOverdueCount;
    private selectByExpertise;
    private selectByWorkload;
}
declare const _default: ValidationQueueService;
export default _default;
//# sourceMappingURL=validationQueueService.d.ts.map