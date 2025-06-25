import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { AIService } from './ai.service';
import axios from 'axios';
import { io } from '../server';
import { addValidationJob } from './queue';

interface LaboratoryReport {
  laboratoryId: string;
  productId: string;
  reportFile: Buffer;
  reportNumber: string;
  mimeType: string;
}

interface ExternalLabResult {
  reportNumber: string;
  status: 'completed' | 'pending' | 'failed';
  results?: any;
  pdfUrl?: string;
}

export class LaboratoryService {
  // Registrar laboratório parceiro
  static async registerLaboratory(data: {
    userId: string;
    name: string;
    cnpj: string;
    accreditation: string[];
    certifications: string[];
    specialties: string[];
    apiEndpoint?: string;
    apiKey?: string;
  }) {
    // Verificar se CNPJ já existe
    const existing = await prisma.laboratory.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existing) {
      throw new AppError('Laboratory with this CNPJ already exists', 409);
    }

    const laboratory = await prisma.laboratory.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });

    logger.info(`New laboratory registered: ${laboratory.name}`);

    return laboratory;
  }

  // Upload de laudo laboratorial
  static async uploadReport(data: LaboratoryReport) {
    const { laboratoryId, productId, reportFile, reportNumber, mimeType } = data;

    // Verificar se laboratório existe e está ativo
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory || laboratory.status !== 'ACTIVE') {
      throw new AppError('Laboratory not found or inactive', 404);
    }

    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { validations: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Criar ou atualizar validação
    let validation = product.validations.find(v => v.status === 'PENDING');
    
    if (!validation) {
      validation = await prisma.validation.create({
        data: {
          productId,
          laboratoryId,
          reportNumber,
          reportUrl: '', // Will be updated after upload
          status: 'PENDING',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    // Parse do laudo com IA
    const parsedData = await AIService.parseLabReport(reportFile, mimeType);

    // Salvar relatório parseado
    const report = await prisma.validationReport.create({
      data: {
        validationId: validation.id,
        laboratoryId,
        reportNumber,
        reportDate: new Date(parsedData.reportDate),
        reportUrl: '', // Will be updated after S3 upload
        rawData: parsedData,
        parsedData,
        status: 'PROCESSING',
      },
    });

    // Adicionar job de validação na fila
    await addValidationJob({
      productId,
      validationId: validation.id,
      reportId: report.id,
    });

    logger.info(`Laboratory report uploaded for product ${productId}`);

    return {
      validationId: validation.id,
      reportId: report.id,
      status: 'processing',
    };
  }

  // Integração com API externa de laboratório
  static async fetchExternalResults(laboratoryId: string, sampleId: string): Promise<ExternalLabResult> {
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory || !laboratory.apiEndpoint || !laboratory.apiKey) {
      throw new AppError('Laboratory API not configured', 400);
    }

    try {
      const response = await axios.get(
        `${laboratory.apiEndpoint}/results/${sampleId}`,
        {
          headers: {
            'Authorization': `Bearer ${laboratory.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch external lab results:`, error);
      throw new AppError('Failed to fetch laboratory results', 500);
    }
  }

  // Webhook para receber resultados de laboratórios
  static async handleWebhook(laboratoryId: string, data: any) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory) {
      throw new AppError('Laboratory not found', 404);
    }

    // Verificar assinatura do webhook (implementar conforme laboratório)
    // if (!this.verifyWebhookSignature(data, laboratory.apiKey)) {
    //   throw new AppError('Invalid webhook signature', 401);
    // }

    const { reportNumber, status, results, pdfUrl } = data;

    // Encontrar relatório
    const report = await prisma.validationReport.findFirst({
      where: {
        reportNumber,
        laboratoryId,
      },
      include: {
        validation: {
          include: { product: true },
        },
      },
    });

    if (!report) {
      logger.warn(`Webhook received for unknown report: ${reportNumber}`);
      return;
    }

    // Atualizar relatório
    await prisma.validationReport.update({
      where: { id: report.id },
      data: {
        status: status === 'completed' ? 'COMPLETED' : 'ERROR',
        parsedData: results,
        reportUrl: pdfUrl || report.reportUrl,
      },
    });

    // Se concluído, processar validação
    if (status === 'completed') {
      await addValidationJob({
        productId: report.validation.productId,
        validationId: report.validationId,
        reportId: report.id,
      });
    }

    // Notificar via WebSocket
    io.to(`product-${report.validation.productId}`).emit('lab-results', {
      reportNumber,
      status,
      timestamp: new Date(),
    });

    logger.info(`Laboratory webhook processed for report ${reportNumber}`);
  }

  // Listar laboratórios parceiros
  static async listLaboratories(filters?: {
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    specialties?: string[];
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.specialties && filters.specialties.length > 0) {
      where.specialties = {
        hasSome: filters.specialties,
      };
    }

    const laboratories = await prisma.laboratory.findMany({
      where,
      select: {
        id: true,
        name: true,
        cnpj: true,
        accreditation: true,
        certifications: true,
        specialties: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return laboratories;
  }

  // Estatísticas do laboratório
  static async getLaboratoryStats(laboratoryId: string) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory) {
      throw new AppError('Laboratory not found', 404);
    }

    const [totalReports, completedReports, pendingReports, avgProcessingTime] = await Promise.all([
      // Total de relatórios
      prisma.validationReport.count({
        where: { laboratoryId },
      }),
      // Relatórios concluídos
      prisma.validationReport.count({
        where: {
          laboratoryId,
          status: 'COMPLETED',
        },
      }),
      // Relatórios pendentes
      prisma.validationReport.count({
        where: {
          laboratoryId,
          status: 'PENDING',
        },
      }),
      // Tempo médio de processamento
      prisma.$queryRaw<[{ avg: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as avg
        FROM "ValidationReport"
        WHERE "laboratoryId" = ${laboratoryId}
        AND status = 'COMPLETED'
      `,
    ]);

    // Relatórios por mês
    const reportsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as count
      FROM "ValidationReport"
      WHERE "laboratoryId" = ${laboratoryId}
      AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `;

    return {
      laboratory: {
        id: laboratory.id,
        name: laboratory.name,
        status: laboratory.status,
      },
      stats: {
        totalReports,
        completedReports,
        pendingReports,
        avgProcessingTimeHours: avgProcessingTime[0]?.avg || 0,
        reportsByMonth: reportsByMonth.map(r => ({
          month: r.month,
          count: Number(r.count),
        })),
      },
    };
  }
}