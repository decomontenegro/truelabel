import { ValidationService } from '@/services/validation.service';
import { AIService } from '@/services/ai.service';
import { NotificationService } from '@/services/notification.service';
import { prisma } from '../../setup';
import { 
  ProductValidationError, 
  NotFoundError,
  BusinessRuleError 
} from '@/errors/app-errors';
import { faker } from '@faker-js/faker';

// Mock dependencies
jest.mock('@/services/ai.service');
jest.mock('@/services/notification.service');

describe('ValidationService', () => {
  let validationService: ValidationService;
  let mockAIService: jest.Mocked<typeof AIService>;
  let mockNotificationService: jest.Mocked<typeof NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAIService = AIService as jest.Mocked<typeof AIService>;
    mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
    
    validationService = new ValidationService();
  });

  describe('createValidation', () => {
    const mockProduct = {
      id: faker.string.uuid(),
      name: 'Test Product',
      description: 'Test Description',
      ean: '1234567890123',
      category: 'supplement',
      brandId: faker.string.uuid(),
      claims: ['High protein', '0% sugar'],
      ingredients: ['Whey protein', 'Natural flavors'],
    };

    const mockLaboratory = {
      id: faker.string.uuid(),
      name: 'Test Lab',
      accreditation: 'ISO17025',
    };

    const mockValidationRequest = {
      productId: mockProduct.id,
      laboratoryId: mockLaboratory.id,
      tests: ['composition', 'claims_verification'],
      priority: 'normal' as const,
    };

    beforeEach(async () => {
      // Create test data
      await prisma.brand.create({
        data: {
          id: mockProduct.brandId,
          name: 'Test Brand',
          email: 'brand@test.com',
        },
      });

      await prisma.product.create({
        data: mockProduct,
      });

      await prisma.laboratory.create({
        data: mockLaboratory,
      });
    });

    it('should create a validation successfully', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: true,
        confidence: 0.95,
        issues: [],
        recommendations: [],
      });

      // Act
      const result = await validationService.createValidation(mockValidationRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.productId).toBe(mockProduct.id);
      expect(result.laboratoryId).toBe(mockLaboratory.id);
      expect(result.status).toBe('PENDING');
      expect(result.priority).toBe('normal');
    });

    it('should throw error if product not found', async () => {
      // Arrange
      const invalidRequest = {
        ...mockValidationRequest,
        productId: faker.string.uuid(),
      };

      // Act & Assert
      await expect(validationService.createValidation(invalidRequest))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw error if laboratory not found', async () => {
      // Arrange
      const invalidRequest = {
        ...mockValidationRequest,
        laboratoryId: faker.string.uuid(),
      };

      // Act & Assert
      await expect(validationService.createValidation(invalidRequest))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should prevent duplicate active validations', async () => {
      // Arrange
      await validationService.createValidation(mockValidationRequest);

      // Act & Assert
      await expect(validationService.createValidation(mockValidationRequest))
        .rejects
        .toThrow(BusinessRuleError);
    });

    it('should send notification on validation creation', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: true,
        confidence: 0.95,
        issues: [],
        recommendations: [],
      });

      // Act
      await validationService.createValidation(mockValidationRequest);

      // Assert
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VALIDATION_CREATED',
          recipient: expect.any(String),
        })
      );
    });
  });

  describe('processValidation', () => {
    let mockValidation: any;

    beforeEach(async () => {
      // Create test validation
      const brand = await prisma.brand.create({
        data: {
          id: faker.string.uuid(),
          name: 'Test Brand',
          email: 'brand@test.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          id: faker.string.uuid(),
          name: 'Test Product',
          ean: '1234567890123',
          category: 'supplement',
          brandId: brand.id,
          claims: ['High protein'],
        },
      });

      const laboratory = await prisma.laboratory.create({
        data: {
          id: faker.string.uuid(),
          name: 'Test Lab',
          accreditation: 'ISO17025',
        },
      });

      mockValidation = await prisma.validation.create({
        data: {
          productId: product.id,
          laboratoryId: laboratory.id,
          status: 'PENDING',
          tests: ['composition'],
        },
      });
    });

    it('should process validation with AI analysis', async () => {
      // Arrange
      const mockAIAnalysis = {
        valid: true,
        confidence: 0.92,
        issues: [],
        recommendations: ['Consider adding nutritional table'],
        categories: ['COMPOSITION_VERIFIED', 'CLAIMS_VALIDATED'],
      };

      mockAIService.analyzeProductClaims.mockResolvedValue(mockAIAnalysis);
      mockAIService.parseLabReport.mockResolvedValue({
        extractedData: { protein: '80g' },
        confidence: 0.95,
      });

      // Act
      const result = await validationService.processValidation(mockValidation.id, {
        labResults: { protein: '80g', sugar: '0g' },
      });

      // Assert
      expect(result.status).toBe('VALIDATED');
      expect(result.aiAnalysis).toEqual(mockAIAnalysis);
      expect(result.confidence).toBe(0.92);
    });

    it('should reject validation with low confidence', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: false,
        confidence: 0.45,
        issues: ['Protein content mismatch', 'Missing certifications'],
        recommendations: [],
      });

      // Act
      const result = await validationService.processValidation(mockValidation.id, {
        labResults: { protein: '60g' },
      });

      // Assert
      expect(result.status).toBe('REJECTED');
      expect(result.confidence).toBe(0.45);
    });

    it('should handle validation with remarks', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: true,
        confidence: 0.78,
        issues: ['Minor labeling inconsistency'],
        recommendations: ['Update product label'],
      });

      // Act
      const result = await validationService.processValidation(mockValidation.id, {
        labResults: { protein: '78g' },
      });

      // Assert
      expect(result.status).toBe('VALIDATED_WITH_REMARKS');
      expect(result.remarks).toContain('Minor labeling inconsistency');
    });

    it('should update product status after validation', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: true,
        confidence: 0.95,
        issues: [],
        recommendations: [],
      });

      // Act
      await validationService.processValidation(mockValidation.id, {
        labResults: { protein: '80g' },
      });

      // Assert
      const product = await prisma.product.findUnique({
        where: { id: mockValidation.productId },
      });
      expect(product?.status).toBe('VALIDATED');
    });

    it('should send notifications after processing', async () => {
      // Arrange
      mockAIService.analyzeProductClaims.mockResolvedValue({
        valid: true,
        confidence: 0.95,
        issues: [],
        recommendations: [],
      });

      // Act
      await validationService.processValidation(mockValidation.id, {
        labResults: { protein: '80g' },
      });

      // Assert
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VALIDATION_COMPLETED',
        })
      );
    });
  });

  describe('getValidationStatus', () => {
    it('should return validation status with details', async () => {
      // Arrange
      const validation = await createTestValidation();

      // Act
      const result = await validationService.getValidationStatus(validation.id);

      // Assert
      expect(result).toMatchObject({
        id: validation.id,
        status: validation.status,
        progress: expect.any(Number),
        estimatedCompletion: expect.any(Date),
      });
    });

    it('should throw error for non-existent validation', async () => {
      // Act & Assert
      await expect(validationService.getValidationStatus(faker.string.uuid()))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('cancelValidation', () => {
    it('should cancel pending validation', async () => {
      // Arrange
      const validation = await createTestValidation({ status: 'PENDING' });

      // Act
      const result = await validationService.cancelValidation(validation.id, 'User requested');

      // Assert
      expect(result.status).toBe('CANCELLED');
      expect(result.notes).toContain('User requested');
    });

    it('should not cancel completed validation', async () => {
      // Arrange
      const validation = await createTestValidation({ status: 'VALIDATED' });

      // Act & Assert
      await expect(validationService.cancelValidation(validation.id, 'Test'))
        .rejects
        .toThrow(BusinessRuleError);
    });
  });

  describe('getValidationReport', () => {
    it('should generate comprehensive validation report', async () => {
      // Arrange
      const validation = await createTestValidation({
        status: 'VALIDATED',
        aiAnalysis: {
          valid: true,
          confidence: 0.95,
          categories: ['COMPOSITION_VERIFIED'],
        },
      });

      // Act
      const report = await validationService.getValidationReport(validation.id);

      // Assert
      expect(report).toMatchObject({
        validation: expect.objectContaining({
          id: validation.id,
          status: 'VALIDATED',
        }),
        product: expect.any(Object),
        laboratory: expect.any(Object),
        timeline: expect.arrayContaining([
          expect.objectContaining({
            status: expect.any(String),
            timestamp: expect.any(Date),
          }),
        ]),
      });
    });
  });

  // Helper function to create test validation
  async function createTestValidation(overrides: any = {}) {
    const brand = await prisma.brand.create({
      data: {
        name: faker.company.name(),
        email: faker.internet.email(),
      },
    });

    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        ean: faker.string.numeric(13),
        category: 'supplement',
        brandId: brand.id,
      },
    });

    const laboratory = await prisma.laboratory.create({
      data: {
        name: faker.company.name(),
        accreditation: 'ISO17025',
        email: faker.internet.email(),
      },
    });

    return prisma.validation.create({
      data: {
        productId: product.id,
        laboratoryId: laboratory.id,
        status: 'PENDING',
        tests: ['composition'],
        ...overrides,
      },
    });
  }
});