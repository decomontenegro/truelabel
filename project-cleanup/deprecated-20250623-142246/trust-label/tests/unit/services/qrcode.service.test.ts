import { QRCodeService } from '@/services/qrcode.service';
import { prisma } from '../../setup';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { 
  NotFoundError,
  BusinessRuleError,
  QRCodeError 
} from '@/errors/app-errors';
import { faker } from '@faker-js/faker';

// Mock dependencies
jest.mock('qrcode');
jest.mock('nanoid');

describe('QRCodeService', () => {
  let qrCodeService: QRCodeService;
  const mockQRCode = QRCode as jest.Mocked<typeof QRCode>;
  const mockNanoid = nanoid as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNanoid.mockReturnValue('short-code-123');
    qrCodeService = new QRCodeService();
  });

  describe('generateQRCode', () => {
    let mockProduct: any;
    let mockValidation: any;

    beforeEach(async () => {
      // Create test data
      const brand = await prisma.brand.create({
        data: {
          name: faker.company.name(),
          email: faker.internet.email(),
        },
      });

      mockProduct = await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          ean: faker.string.numeric(13),
          category: 'supplement',
          brandId: brand.id,
          status: 'VALIDATED',
        },
      });

      const laboratory = await prisma.laboratory.create({
        data: {
          name: faker.company.name(),
          accreditation: 'ISO17025',
          email: faker.internet.email(),
        },
      });

      mockValidation = await prisma.validation.create({
        data: {
          productId: mockProduct.id,
          laboratoryId: laboratory.id,
          status: 'VALIDATED',
          validatedAt: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    });

    it('should generate QR code for validated product', async () => {
      // Arrange
      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockbase64data');
      mockQRCode.toBuffer.mockResolvedValue(Buffer.from('mock-qr-buffer'));

      // Act
      const result = await qrCodeService.generateQRCode(mockProduct.id);

      // Assert
      expect(result).toMatchObject({
        code: 'short-code-123',
        shortUrl: expect.stringContaining('/v/short-code-123'),
        fullUrl: expect.stringContaining(`/product/${mockProduct.id}`),
        imageUrl: 'data:image/png;base64,mockbase64data',
        productId: mockProduct.id,
      });

      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('/v/short-code-123'),
        expect.objectContaining({
          width: 300,
          margin: 2,
        })
      );
    });

    it('should throw error for non-validated product', async () => {
      // Arrange
      await prisma.product.update({
        where: { id: mockProduct.id },
        data: { status: 'PENDING' },
      });

      // Act & Assert
      await expect(qrCodeService.generateQRCode(mockProduct.id))
        .rejects
        .toThrow(BusinessRuleError);
    });

    it('should throw error for product without validation', async () => {
      // Arrange
      await prisma.validation.delete({
        where: { id: mockValidation.id },
      });

      // Act & Assert
      await expect(qrCodeService.generateQRCode(mockProduct.id))
        .rejects
        .toThrow(BusinessRuleError);
    });

    it('should reuse existing active QR code', async () => {
      // Arrange
      const existingQRCode = await prisma.qRCode.create({
        data: {
          code: 'existing-code',
          productId: mockProduct.id,
          shortUrl: 'https://trustlabel.com/v/existing-code',
          fullUrl: `https://trustlabel.com/product/${mockProduct.id}`,
          isActive: true,
        },
      });

      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,existingdata');

      // Act
      const result = await qrCodeService.generateQRCode(mockProduct.id);

      // Assert
      expect(result.code).toBe('existing-code');
      expect(mockNanoid).not.toHaveBeenCalled();
    });

    it('should customize QR code appearance', async () => {
      // Arrange
      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,customdata');

      const customOptions = {
        width: 500,
        margin: 4,
        color: {
          dark: '#FF0000',
          light: '#0000FF',
        },
        logo: 'https://example.com/logo.png',
      };

      // Act
      await qrCodeService.generateQRCode(mockProduct.id, customOptions);

      // Assert
      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 500,
          margin: 4,
          color: customOptions.color,
        })
      );
    });

    it('should generate batch QR codes', async () => {
      // Arrange
      const product2 = await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          ean: faker.string.numeric(13),
          category: 'supplement',
          brandId: mockProduct.brandId,
          status: 'VALIDATED',
        },
      });

      await prisma.validation.create({
        data: {
          productId: product2.id,
          laboratoryId: mockValidation.laboratoryId,
          status: 'VALIDATED',
          validatedAt: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,batchdata');
      mockNanoid
        .mockReturnValueOnce('batch-code-1')
        .mockReturnValueOnce('batch-code-2');

      // Act
      const results = await qrCodeService.generateBatchQRCodes([
        mockProduct.id,
        product2.id,
      ]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].code).toBe('batch-code-1');
      expect(results[1].code).toBe('batch-code-2');
    });
  });

  describe('trackScan', () => {
    let mockQRCode: any;

    beforeEach(async () => {
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

      mockQRCode = await prisma.qRCode.create({
        data: {
          code: 'test-qr-code',
          productId: product.id,
          shortUrl: 'https://trustlabel.com/v/test-qr-code',
          fullUrl: `https://trustlabel.com/product/${product.id}`,
          isActive: true,
        },
      });
    });

    it('should track QR code scan successfully', async () => {
      // Arrange
      const scanData = {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        referrer: faker.internet.url(),
      };

      // Act
      const result = await qrCodeService.trackScan(mockQRCode.code, scanData);

      // Assert
      expect(result).toMatchObject({
        qrCodeId: mockQRCode.id,
        ipAddress: scanData.ipAddress,
        userAgent: scanData.userAgent,
        referrer: scanData.referrer,
        location: expect.objectContaining({
          country: expect.any(String),
          city: expect.any(String),
        }),
      });

      // Verify scan count increased
      const updatedQRCode = await prisma.qRCode.findUnique({
        where: { id: mockQRCode.id },
      });
      expect(updatedQRCode?.scanCount).toBe(1);
    });

    it('should throw error for invalid QR code', async () => {
      // Act & Assert
      await expect(qrCodeService.trackScan('invalid-code', {}))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should track scan for inactive QR code with warning', async () => {
      // Arrange
      await prisma.qRCode.update({
        where: { id: mockQRCode.id },
        data: { isActive: false },
      });

      // Act
      const result = await qrCodeService.trackScan(mockQRCode.code, {});

      // Assert
      expect(result).toBeDefined();
      expect(result.warning).toContain('inactive');
    });

    it('should geolocate scan based on IP', async () => {
      // Arrange
      const brazilianIP = '177.71.150.100'; // Brazilian IP
      
      // Act
      const result = await qrCodeService.trackScan(mockQRCode.code, {
        ipAddress: brazilianIP,
      });

      // Assert
      expect(result.location).toBeDefined();
      expect(result.location?.country).toBeTruthy();
    });

    it('should handle rate limiting for scans', async () => {
      // Arrange
      const ipAddress = faker.internet.ip();
      
      // Create 10 scans from same IP
      for (let i = 0; i < 10; i++) {
        await qrCodeService.trackScan(mockQRCode.code, { ipAddress });
      }

      // Act & Assert - 11th scan should be rate limited
      await expect(qrCodeService.trackScan(mockQRCode.code, { ipAddress }))
        .rejects
        .toThrow(BusinessRuleError);
    });
  });

  describe('getQRCodeAnalytics', () => {
    let mockQRCode: any;

    beforeEach(async () => {
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

      mockQRCode = await prisma.qRCode.create({
        data: {
          code: 'analytics-test',
          productId: product.id,
          shortUrl: 'https://trustlabel.com/v/analytics-test',
          fullUrl: `https://trustlabel.com/product/${product.id}`,
          isActive: true,
        },
      });

      // Create some scan data
      for (let i = 0; i < 5; i++) {
        await prisma.qRCodeScan.create({
          data: {
            qrCodeId: mockQRCode.id,
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
            location: {
              country: faker.location.countryCode(),
              city: faker.location.city(),
            },
          },
        });
      }
    });

    it('should return comprehensive analytics', async () => {
      // Act
      const analytics = await qrCodeService.getQRCodeAnalytics(mockQRCode.code);

      // Assert
      expect(analytics).toMatchObject({
        code: mockQRCode.code,
        totalScans: 5,
        uniqueScans: expect.any(Number),
        scansByDate: expect.any(Array),
        scansByLocation: expect.any(Array),
        scansByDevice: expect.any(Array),
        peakScanTime: expect.any(Object),
        averageScansPerDay: expect.any(Number),
      });
    });

    it('should calculate unique scans correctly', async () => {
      // Arrange - Add duplicate IP scans
      const duplicateIP = faker.internet.ip();
      await prisma.qRCodeScan.createMany({
        data: [
          { qrCodeId: mockQRCode.id, ipAddress: duplicateIP },
          { qrCodeId: mockQRCode.id, ipAddress: duplicateIP },
        ],
      });

      // Act
      const analytics = await qrCodeService.getQRCodeAnalytics(mockQRCode.code);

      // Assert
      expect(analytics.totalScans).toBe(7);
      expect(analytics.uniqueScans).toBeLessThan(7);
    });

    it('should group scans by location', async () => {
      // Act
      const analytics = await qrCodeService.getQRCodeAnalytics(mockQRCode.code);

      // Assert
      expect(analytics.scansByLocation).toBeInstanceOf(Array);
      analytics.scansByLocation.forEach((location: any) => {
        expect(location).toMatchObject({
          country: expect.any(String),
          count: expect.any(Number),
          percentage: expect.any(Number),
        });
      });
    });
  });

  describe('deactivateQRCode', () => {
    it('should deactivate QR code', async () => {
      // Arrange
      const qrCode = await createTestQRCode();

      // Act
      await qrCodeService.deactivateQRCode(qrCode.code);

      // Assert
      const updated = await prisma.qRCode.findUnique({
        where: { id: qrCode.id },
      });
      expect(updated?.isActive).toBe(false);
    });

    it('should throw error for non-existent QR code', async () => {
      // Act & Assert
      await expect(qrCodeService.deactivateQRCode('non-existent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('regenerateQRCode', () => {
    it('should regenerate QR code with new code', async () => {
      // Arrange
      const qrCode = await createTestQRCode();
      mockNanoid.mockReturnValue('new-code-456');
      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,newdata');

      // Act
      const result = await qrCodeService.regenerateQRCode(qrCode.productId);

      // Assert
      expect(result.code).toBe('new-code-456');
      
      // Old QR code should be deactivated
      const oldQRCode = await prisma.qRCode.findUnique({
        where: { id: qrCode.id },
      });
      expect(oldQRCode?.isActive).toBe(false);
    });
  });

  // Helper function
  async function createTestQRCode() {
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
        status: 'VALIDATED',
      },
    });

    return prisma.qRCode.create({
      data: {
        code: faker.string.alphanumeric(10),
        productId: product.id,
        shortUrl: faker.internet.url(),
        fullUrl: faker.internet.url(),
        isActive: true,
      },
    });
  }
});