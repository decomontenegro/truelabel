import QRCode from 'qrcode';
import short from 'short-uuid';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler';
import { io } from '../server';

export interface QRCodeData {
  productId: string;
  code: string;
  shortUrl: string;
  fullUrl: string;
  qrCodeImage: string;
}

export class QRCodeService {
  private static translator = short();

  static async generateQRCode(productId: string): Promise<QRCodeData> {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Check if QR code already exists
      const existingQR = await prisma.qRCode.findFirst({
        where: { productId, isActive: true },
      });

      if (existingQR) {
        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(existingQR.fullUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        return {
          productId,
          code: existingQR.code,
          shortUrl: existingQR.shortUrl,
          fullUrl: existingQR.fullUrl,
          qrCodeImage,
        };
      }

      // Generate unique code
      const code = this.translator.generate();
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shortUrl = `${baseUrl}/v/${code}`;
      const fullUrl = `${baseUrl}/product/${productId}/validation?qr=${code}`;

      // Save to database
      await prisma.qRCode.create({
        data: {
          productId,
          code,
          shortUrl,
          fullUrl,
        },
      });

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      logger.info(`QR code generated for product ${productId}`);

      return {
        productId,
        code,
        shortUrl,
        fullUrl,
        qrCodeImage,
      };
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  static async trackScan(code: string, scanData: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    location?: any;
  }): Promise<void> {
    try {
      // Find QR code
      const qrCode = await prisma.qRCode.findFirst({
        where: { code, isActive: true },
        include: { product: true },
      });

      if (!qrCode) {
        throw new AppError('Invalid QR code', 404);
      }

      // Create scan log
      await prisma.scanLog.create({
        data: {
          qrCodeId: qrCode.id,
          ip: scanData.ipAddress,
          userAgent: scanData.userAgent,
          referrer: scanData.referrer,
          location: scanData.location,
        },
      });

      // Update scan count
      await prisma.qRCode.update({
        where: { id: qrCode.id },
        data: { scans: { increment: 1 } },
      });

      // Emit real-time event
      io.to(`product-${qrCode.productId}`).emit('qr-scan', {
        productId: qrCode.productId,
        timestamp: new Date(),
        location: scanData.location,
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'QR_SCAN',
          entity: 'QRCODE',
          entityId: qrCode.id,
          metadata: {
            productId: qrCode.productId,
            productName: qrCode.product.name,
            ...scanData,
          },
          ip: scanData.ipAddress,
          userAgent: scanData.userAgent,
        },
      });

      logger.info(`QR code scanned: ${code}`);
    } catch (error) {
      logger.error('Failed to track QR scan:', error);
      throw error;
    }
  }

  static async getQRCodeAnalytics(productId: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }) {
    try {
      const qrCodes = await prisma.qRCode.findMany({
        where: { productId },
        include: {
          scanLogs: {
            where: timeRange ? {
              createdAt: {
                gte: timeRange.startDate,
                lte: timeRange.endDate,
              },
            } : undefined,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
      const uniqueScans = new Set(
        qrCodes.flatMap(qr => qr.scanLogs.map(log => log.ip))
      ).size;

      // Group scans by date
      const scansByDate = qrCodes.flatMap(qr => qr.scanLogs).reduce((acc, scan) => {
        const date = scan.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group scans by location
      const scansByLocation = qrCodes.flatMap(qr => qr.scanLogs).reduce((acc, scan) => {
        if (scan.location?.country) {
          const country = scan.location.country;
          acc[country] = (acc[country] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get recent scans
      const recentScans = qrCodes
        .flatMap(qr => qr.scanLogs.map(log => ({
          ...log,
          qrCode: qr.code,
        })))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      return {
        totalScans,
        uniqueScans,
        scansByDate,
        scansByLocation,
        recentScans,
        qrCodes: qrCodes.map(qr => ({
          code: qr.code,
          shortUrl: qr.shortUrl,
          scans: qr.scans,
          isActive: qr.isActive,
          createdAt: qr.createdAt,
        })),
      };
    } catch (error) {
      logger.error('Failed to get QR code analytics:', error);
      throw error;
    }
  }

  static async deactivateQRCode(code: string): Promise<void> {
    try {
      await prisma.qRCode.update({
        where: { code },
        data: { isActive: false },
      });

      logger.info(`QR code deactivated: ${code}`);
    } catch (error) {
      logger.error('Failed to deactivate QR code:', error);
      throw error;
    }
  }

  static async regenerateQRCode(productId: string): Promise<QRCodeData> {
    try {
      // Deactivate existing QR codes
      await prisma.qRCode.updateMany({
        where: { productId },
        data: { isActive: false },
      });

      // Generate new QR code
      return await this.generateQRCode(productId);
    } catch (error) {
      logger.error('Failed to regenerate QR code:', error);
      throw error;
    }
  }
}