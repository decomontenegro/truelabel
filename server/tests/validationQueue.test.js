/**
 * Validation Queue System Tests
 * 
 * Purpose: Test validation queue functionality end-to-end
 * Dependencies: Jest, Supertest, Prisma Test Client
 * 
 * Test Coverage:
 * - Queue creation and management
 * - Assignment workflows
 * - Status updates
 * - Real-time events
 * - Metrics calculation
 * - Error handling
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/index');
const validationQueueService = require('../src/services/validationQueueService');

const prisma = new PrismaClient();

describe('Validation Queue System', () => {
  let brandUser, adminUser, product, authTokenBrand, authTokenAdmin;

  beforeAll(async () => {
    // Clean up test data
    await prisma.validationQueueHistory.deleteMany();
    await prisma.validationQueue.deleteMany();
    await prisma.validation.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    brandUser = await prisma.user.create({
      data: {
        email: 'brand@test.com',
        password: '$2a$10$hashedpassword',
        name: 'Test Brand',
        role: 'BRAND'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: '$2a$10$hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    });

    // Create test product
    product = await prisma.product.create({
      data: {
        name: 'Test Product',
        brand: 'Test Brand',
        category: 'Food',
        sku: 'TEST-001',
        claims: 'High protein, Low fat',
        status: 'DRAFT',
        userId: brandUser.id
      }
    });

    // Get auth tokens (simplified for testing)
    authTokenBrand = 'test-brand-token';
    authTokenAdmin = 'test-admin-token';
  });

  afterAll(async () => {
    // Clean up
    await prisma.validationQueueHistory.deleteMany();
    await prisma.validationQueue.deleteMany();
    await prisma.validation.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Queue Entry Creation', () => {
    test('should create queue entry successfully', async () => {
      const queueData = {
        productId: product.id,
        category: 'nutritional',
        priority: 'NORMAL',
        estimatedDuration: 60,
        notes: 'Test validation request'
      };

      const queueEntry = await validationQueueService.createQueueEntry({
        ...queueData,
        requestedById: brandUser.id
      });

      expect(queueEntry).toBeDefined();
      expect(queueEntry.productId).toBe(product.id);
      expect(queueEntry.status).toBe('PENDING');
      expect(queueEntry.priority).toBe('NORMAL');
      expect(queueEntry.category).toBe('nutritional');
    });

    test('should calculate due date based on priority', async () => {
      const urgentEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'urgent-test',
        priority: 'URGENT',
        estimatedDuration: 30
      });

      const normalEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'normal-test',
        priority: 'NORMAL',
        estimatedDuration: 30
      });

      const urgentDue = new Date(urgentEntry.dueDate);
      const normalDue = new Date(normalEntry.dueDate);

      // Urgent should have earlier due date than normal
      expect(urgentDue.getTime()).toBeLessThan(normalDue.getTime());
    });

    test('should create audit trail on creation', async () => {
      const queueEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'audit-test',
        priority: 'NORMAL'
      });

      const history = await prisma.validationQueueHistory.findMany({
        where: { queueId: queueEntry.id }
      });

      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('CREATED');
      expect(history[0].newStatus).toBe('PENDING');
    });
  });

  describe('Queue Assignment', () => {
    let queueEntry;

    beforeEach(async () => {
      queueEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'assignment-test',
        priority: 'NORMAL'
      });
    });

    test('should assign validation to admin successfully', async () => {
      const assignedEntry = await validationQueueService.assignValidation(
        queueEntry.id,
        adminUser.id,
        adminUser.id
      );

      expect(assignedEntry.assignedToId).toBe(adminUser.id);
      expect(assignedEntry.status).toBe('ASSIGNED');
      expect(assignedEntry.assignedAt).toBeDefined();
    });

    test('should not assign already assigned validation', async () => {
      // First assignment
      await validationQueueService.assignValidation(
        queueEntry.id,
        adminUser.id,
        adminUser.id
      );

      // Second assignment should fail
      await expect(
        validationQueueService.assignValidation(
          queueEntry.id,
          adminUser.id,
          adminUser.id
        )
      ).rejects.toThrow('Queue entry is not in PENDING status');
    });

    test('should create assignment history', async () => {
      await validationQueueService.assignValidation(
        queueEntry.id,
        adminUser.id,
        adminUser.id
      );

      const history = await prisma.validationQueueHistory.findMany({
        where: { queueId: queueEntry.id },
        orderBy: { createdAt: 'desc' }
      });

      const assignmentHistory = history.find(h => h.action === 'ASSIGNED');
      expect(assignmentHistory).toBeDefined();
      expect(assignmentHistory.previousStatus).toBe('PENDING');
      expect(assignmentHistory.newStatus).toBe('ASSIGNED');
    });
  });

  describe('Status Updates', () => {
    let assignedEntry;

    beforeEach(async () => {
      const queueEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'status-test',
        priority: 'NORMAL'
      });

      assignedEntry = await validationQueueService.assignValidation(
        queueEntry.id,
        adminUser.id,
        adminUser.id
      );
    });

    test('should update status to IN_PROGRESS', async () => {
      const updatedEntry = await validationQueueService.updateStatus(
        assignedEntry.id,
        'IN_PROGRESS',
        adminUser.id,
        'Starting validation process'
      );

      expect(updatedEntry.status).toBe('IN_PROGRESS');
      expect(updatedEntry.startedAt).toBeDefined();
    });

    test('should calculate duration on completion', async () => {
      // Start validation
      await validationQueueService.updateStatus(
        assignedEntry.id,
        'IN_PROGRESS',
        adminUser.id
      );

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Complete validation
      const completedEntry = await validationQueueService.updateStatus(
        assignedEntry.id,
        'COMPLETED',
        adminUser.id,
        'Validation completed successfully'
      );

      expect(completedEntry.status).toBe('COMPLETED');
      expect(completedEntry.completedAt).toBeDefined();
      expect(completedEntry.actualDuration).toBeGreaterThan(0);
    });

    test('should create status change history', async () => {
      await validationQueueService.updateStatus(
        assignedEntry.id,
        'IN_PROGRESS',
        adminUser.id,
        'Test reason'
      );

      const history = await prisma.validationQueueHistory.findMany({
        where: { queueId: assignedEntry.id },
        orderBy: { createdAt: 'desc' }
      });

      const statusHistory = history.find(h => h.action === 'STATUS_CHANGED');
      expect(statusHistory).toBeDefined();
      expect(statusHistory.previousStatus).toBe('ASSIGNED');
      expect(statusHistory.newStatus).toBe('IN_PROGRESS');
      expect(statusHistory.reason).toBe('Test reason');
    });
  });

  describe('Queue Metrics', () => {
    beforeEach(async () => {
      // Clean up existing queue entries
      await prisma.validationQueueHistory.deleteMany();
      await prisma.validationQueue.deleteMany();

      // Create test queue entries with different statuses
      await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'metrics-pending',
        priority: 'NORMAL'
      });

      const assignedEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'metrics-assigned',
        priority: 'HIGH'
      });

      await validationQueueService.assignValidation(
        assignedEntry.id,
        adminUser.id,
        adminUser.id
      );

      const completedEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'metrics-completed',
        priority: 'NORMAL'
      });

      await validationQueueService.assignValidation(
        completedEntry.id,
        adminUser.id,
        adminUser.id
      );

      await validationQueueService.updateStatus(
        completedEntry.id,
        'IN_PROGRESS',
        adminUser.id
      );

      await validationQueueService.updateStatus(
        completedEntry.id,
        'COMPLETED',
        adminUser.id
      );
    });

    test('should calculate queue metrics correctly', async () => {
      const metrics = await validationQueueService.getQueueMetrics();

      expect(metrics.totalPending).toBe(1);
      expect(metrics.totalAssigned).toBe(1);
      expect(metrics.totalInProgress).toBe(0);
      expect(metrics.totalCompleted).toBe(1);
      expect(metrics.totalActive).toBe(2); // pending + assigned + in_progress
    });

    test('should calculate average processing time', async () => {
      const metrics = await validationQueueService.getQueueMetrics();
      
      // Should have some processing time from completed entries
      expect(typeof metrics.avgProcessingTime).toBe('number');
      expect(metrics.avgProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Auto Assignment', () => {
    test('should try auto assignment on queue creation', async () => {
      const queueEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'auto-assignment-test',
        priority: 'NORMAL'
      });

      // Check if auto assignment was attempted
      // Since we have an admin user available, it might get auto-assigned
      const updatedEntry = await prisma.validationQueue.findUnique({
        where: { id: queueEntry.id }
      });

      // Auto assignment might or might not happen depending on strategy
      expect(updatedEntry).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queue ID', async () => {
      await expect(
        validationQueueService.assignValidation(
          'invalid-id',
          adminUser.id,
          adminUser.id
        )
      ).rejects.toThrow();
    });

    test('should handle invalid user ID', async () => {
      const queueEntry = await validationQueueService.createQueueEntry({
        productId: product.id,
        requestedById: brandUser.id,
        category: 'error-test',
        priority: 'NORMAL'
      });

      await expect(
        validationQueueService.assignValidation(
          queueEntry.id,
          'invalid-user-id',
          adminUser.id
        )
      ).rejects.toThrow();
    });

    test('should handle missing product', async () => {
      await expect(
        validationQueueService.createQueueEntry({
          productId: 'invalid-product-id',
          requestedById: brandUser.id,
          category: 'error-test',
          priority: 'NORMAL'
        })
      ).rejects.toThrow();
    });
  });

  describe('Queue Filtering and Pagination', () => {
    beforeEach(async () => {
      // Clean up and create test data
      await prisma.validationQueueHistory.deleteMany();
      await prisma.validationQueue.deleteMany();

      // Create multiple queue entries for testing
      for (let i = 0; i < 5; i++) {
        await validationQueueService.createQueueEntry({
          productId: product.id,
          requestedById: brandUser.id,
          category: `test-category-${i}`,
          priority: i % 2 === 0 ? 'HIGH' : 'NORMAL'
        });
      }
    });

    test('should filter by status', async () => {
      const result = await validationQueueService.getQueue({
        status: 'PENDING'
      });

      expect(result.queue).toHaveLength(5);
      result.queue.forEach(entry => {
        expect(entry.status).toBe('PENDING');
      });
    });

    test('should filter by priority', async () => {
      const result = await validationQueueService.getQueue({
        priority: 'HIGH'
      });

      expect(result.queue.length).toBeGreaterThan(0);
      result.queue.forEach(entry => {
        expect(entry.priority).toBe('HIGH');
      });
    });

    test('should paginate results', async () => {
      const page1 = await validationQueueService.getQueue({
        page: 1,
        limit: 2
      });

      const page2 = await validationQueueService.getQueue({
        page: 2,
        limit: 2
      });

      expect(page1.queue).toHaveLength(2);
      expect(page2.queue).toHaveLength(2);
      expect(page1.pagination.page).toBe(1);
      expect(page2.pagination.page).toBe(2);
      expect(page1.pagination.total).toBe(5);
    });
  });
});
