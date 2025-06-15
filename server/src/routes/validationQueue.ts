/**
 * Validation Queue Routes
 * 
 * Purpose: Handle validation queue API endpoints
 * Dependencies: Express Router, Validation Queue Controller, Auth Middleware
 */

import { Router } from 'express';
import validationQueueController from '../controllers/validationQueueController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Get validation queue with filters
router.get('/', validationQueueController.getQueue.bind(validationQueueController));

// Get queue metrics
router.get('/metrics', requireRole('ADMIN'), validationQueueController.getQueueMetrics.bind(validationQueueController));

// Create new queue entry
router.post('/', validationQueueController.createQueueEntry.bind(validationQueueController));

// Get specific queue entry
router.get('/:id', validationQueueController.getQueueEntry.bind(validationQueueController));

// Assign validation to validator
router.post('/:id/assign', requireRole('ADMIN'), validationQueueController.assignValidation.bind(validationQueueController));

// Update queue entry status
router.patch('/:id/status', validationQueueController.updateStatus.bind(validationQueueController));

// Cancel queue entry
router.delete('/:id', validationQueueController.cancelQueueEntry.bind(validationQueueController));

export default router;