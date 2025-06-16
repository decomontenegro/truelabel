import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class QRService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateQRCode(productId: string): Promise<{ qrCode: string; url: string }> {
    // Generate unique code
    const code = this.generateUniqueCode();
    
    // Create short URL
    const baseUrl = this.configService.get('NEXT_PUBLIC_APP_URL') || 'https://trust-label.com';
    const shortUrl = `${baseUrl}/v/${code}`;
    const fullUrl = `${baseUrl}/product/${productId}/validation`;

    // Check if product already has an active QR code
    const existingQR = await this.prisma.qRCode.findFirst({
      where: {
        productId,
        isActive: true,
      },
    });

    if (existingQR) {
      // Deactivate existing QR code
      await this.prisma.qRCode.update({
        where: { id: existingQR.id },
        data: { isActive: false },
      });
    }

    // Create new QR code record
    const qrRecord = await this.prisma.qRCode.create({
      data: {
        productId,
        code,
        shortUrl,
        fullUrl,
        version: existingQR ? existingQR.version + 1 : 1,
      },
    });

    // Generate QR code image
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 1,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 500,
    };

    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, qrOptions);

    return {
      qrCode: qrCodeDataUrl,
      url: shortUrl,
    };
  }

  async generateQRCodeSVG(productId: string): Promise<{ svg: string; url: string }> {
    const qrRecord = await this.getActiveQRCode(productId);
    
    if (!qrRecord) {
      throw new Error('No active QR code found for this product');
    }

    const svg = await QRCode.toString(qrRecord.shortUrl, {
      type: 'svg',
      width: 500,
      errorCorrectionLevel: 'H',
    });

    return {
      svg,
      url: qrRecord.shortUrl,
    };
  }

  async getActiveQRCode(productId: string) {
    return this.prisma.qRCode.findFirst({
      where: {
        productId,
        isActive: true,
      },
    });
  }

  async recordScan(code: string, metadata?: {
    ip?: string;
    userAgent?: string;
    location?: any;
    referrer?: string;
  }) {
    // Find QR code by code
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { code },
      include: { product: true },
    });

    if (!qrCode) {
      throw new Error('Invalid QR code');
    }

    if (!qrCode.isActive) {
      throw new Error('QR code is no longer active');
    }

    // Increment scan count
    await this.prisma.qRCode.update({
      where: { id: qrCode.id },
      data: { scans: { increment: 1 } },
    });

    // Record scan log
    await this.prisma.scanLog.create({
      data: {
        qrCodeId: qrCode.id,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
        location: metadata?.location,
        referrer: metadata?.referrer,
      },
    });

    return {
      productId: qrCode.productId,
      product: qrCode.product,
    };
  }

  async getQRCodeStats(productId: string) {
    const qrCodes = await this.prisma.qRCode.findMany({
      where: { productId },
      include: {
        _count: {
          select: { scanLogs: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
    const activeQR = qrCodes.find(qr => qr.isActive);

    // Get scan timeline for active QR
    let scanTimeline = [];
    if (activeQR) {
      const scans = await this.prisma.scanLog.groupBy({
        by: ['createdAt'],
        where: { qrCodeId: activeQR.id },
        _count: true,
      });

      scanTimeline = scans.map(scan => ({
        date: scan.createdAt,
        count: scan._count,
      }));
    }

    // Get geographic distribution
    const geoDistribution = await this.getGeographicDistribution(activeQR?.id);

    return {
      totalScans,
      activeQRCode: activeQR,
      versions: qrCodes.length,
      scanTimeline,
      geoDistribution,
    };
  }

  private async getGeographicDistribution(qrCodeId?: string) {
    if (!qrCodeId) return [];

    const scans = await this.prisma.scanLog.findMany({
      where: { qrCodeId },
      select: { location: true },
    });

    // Group by country/region
    const distribution = scans.reduce((acc, scan) => {
      if (scan.location?.country) {
        acc[scan.location.country] = (acc[scan.location.country] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(distribution).map(([country, count]) => ({
      country,
      count,
    }));
  }

  private generateUniqueCode(): string {
    // Generate a URL-safe unique code
    return randomBytes(6).toString('base64url');
  }

  async generateBulkQRCodes(productIds: string[]) {
    const results = [];

    for (const productId of productIds) {
      try {
        const result = await this.generateQRCode(productId);
        results.push({
          productId,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}