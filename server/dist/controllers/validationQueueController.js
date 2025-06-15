"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const validationQueueService_1 = __importDefault(require("../services/validationQueueService"));
class ValidationQueueController {
    async getQueue(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            const { status, assignedToId, category, priority, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                status,
                category,
                priority,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            };
            if (req.user?.role === 'ADMIN') {
                if (assignedToId) {
                    filters.assignedToId = assignedToId;
                }
            }
            else if (req.user?.role === 'BRAND') {
                filters.requestedById = req.user.id;
            }
            else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const result = await validationQueueService_1.default.getQueue(filters);
            return res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Get queue error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get validation queue',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async createQueueEntry(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            const { productId, category, priority = 'NORMAL', estimatedDuration, notes, metadata } = req.body;
            if (req.user?.role !== 'BRAND') {
                return res.status(403).json({
                    success: false,
                    message: 'Only brands can request validations'
                });
            }
            const queueEntry = await validationQueueService_1.default.createQueueEntry({
                productId,
                requestedById: req.user.id,
                category,
                priority,
                estimatedDuration,
                notes,
                metadata
            });
            return res.status(201).json({
                success: true,
                message: 'Validation request created successfully',
                data: queueEntry
            });
        }
        catch (error) {
            console.error('Create queue entry error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create validation request',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async assignValidation(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            const { id } = req.params;
            const { assignedToId } = req.body;
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can assign validations'
                });
            }
            const updatedEntry = await validationQueueService_1.default.assignValidation(id, assignedToId, req.user.id);
            return res.json({
                success: true,
                message: 'Validation assigned successfully',
                data: updatedEntry
            });
        }
        catch (error) {
            console.error('Assign validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to assign validation',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateStatus(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            const { id } = req.params;
            const { status, reason } = req.body;
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can update validation status'
                });
            }
            const updatedEntry = await validationQueueService_1.default.updateStatus(id, status, req.user.id, reason);
            return res.json({
                success: true,
                message: 'Status updated successfully',
                data: updatedEntry
            });
        }
        catch (error) {
            console.error('Update status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getMetrics(req, res) {
        try {
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const metrics = await validationQueueService_1.default.getQueueMetrics();
            return res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            console.error('Get metrics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get queue metrics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getQueueEntry(req, res) {
        try {
            const { id } = req.params;
            const queueEntry = await validationQueueService_1.default.getQueue({
                id,
                limit: 1
            });
            if (!queueEntry.queue.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Queue entry not found'
                });
            }
            const entry = queueEntry.queue[0];
            if (req.user?.role !== 'ADMIN' &&
                entry.requestedById !== req.user.id &&
                entry.assignedToId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            return res.json({
                success: true,
                data: entry
            });
        }
        catch (error) {
            console.error('Get queue entry error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get queue entry',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getQueueHistory(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const history = await validationQueueService_1.default.getQueueHistory(id);
            return res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            console.error('Get queue history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get queue history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async cancelQueueEntry(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const updatedEntry = await validationQueueService_1.default.updateStatus(id, 'CANCELLED', req.user.id, reason || 'Cancelled by user');
            return res.json({
                success: true,
                message: 'Queue entry cancelled successfully',
                data: updatedEntry
            });
        }
        catch (error) {
            console.error('Cancel queue entry error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel queue entry',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.default = new ValidationQueueController();
//# sourceMappingURL=validationQueueController.js.map