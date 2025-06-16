import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { ClaimExtractorService } from '../services/claim-extractor.service';
import { ReportParserService } from '../services/report-parser.service';
import { ValidationMatcherService } from '../services/validation-matcher.service';
import { AnomalyDetectorService } from '../services/anomaly-detector.service';
import { AIJobStatus } from '@prisma/client';

@Processor('ai-analysis')
export class AIProcessor {
  constructor(
    private prisma: PrismaService,
    private claimExtractor: ClaimExtractorService,
    private reportParser: ReportParserService,
    private validationMatcher: ValidationMatcherService,
    private anomalyDetector: AnomalyDetectorService,
  ) {}

  @Process('extract-claims')
  async handleClaimExtraction(job: Job) {
    const { jobId, imageUrl, productId } = job.data;

    try {
      await this.updateJobStatus(jobId, AIJobStatus.PROCESSING);

      const result = await this.claimExtractor.extractFromImage(imageUrl);

      if (result.success && result.claims.length > 0) {
        // Save claims to database
        for (const claim of result.claims) {
          await this.prisma.claim.create({
            data: {
              productId,
              type: claim.type,
              category: claim.category,
              value: claim.value,
              unit: claim.unit,
              description: claim.name,
            },
          });
        }
      }

      await this.updateJobStatus(jobId, AIJobStatus.COMPLETED, result);
      return result;
    } catch (error) {
      await this.updateJobStatus(jobId, AIJobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  @Process('parse-report')
  async handleReportParsing(job: Job) {
    const { jobId, reportUrl, validationId } = job.data;

    try {
      await this.updateJobStatus(jobId, AIJobStatus.PROCESSING);

      const result = await this.reportParser.parseReport(reportUrl);

      if (result.success) {
        // Store parsed data in validation metadata
        await this.prisma.validation.update({
          where: { id: validationId },
          data: {
            aiAnalysis: {
              parsedReport: result.results,
              metadata: result.metadata,
            },
          },
        });
      }

      await this.updateJobStatus(jobId, AIJobStatus.COMPLETED, result);
      return result;
    } catch (error) {
      await this.updateJobStatus(jobId, AIJobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  @Process('match-claims')
  async handleClaimMatching(job: Job) {
    const { jobId, productId, validationId } = job.data;

    try {
      await this.updateJobStatus(jobId, AIJobStatus.PROCESSING);

      // Get product claims
      const claims = await this.prisma.claim.findMany({
        where: { productId },
      });

      // Get validation report data
      const validation = await this.prisma.validation.findUnique({
        where: { id: validationId },
      });

      const reportData = validation?.aiAnalysis?.parsedReport || [];

      const result = await this.validationMatcher.matchClaimsWithReport(claims, reportData);

      if (result.success) {
        // Create validation claims
        for (const match of result.matches) {
          await this.prisma.validationClaim.upsert({
            where: {
              validationId_claimId: {
                validationId,
                claimId: match.claimId,
              },
            },
            create: {
              validationId,
              claimId: match.claimId,
              status: match.status,
              actualValue: match.reportMatch?.value?.toString(),
              remarks: match.remarks,
              confidence: match.confidence,
              methodology: match.reportMatch?.methodology,
            },
            update: {
              status: match.status,
              actualValue: match.reportMatch?.value?.toString(),
              remarks: match.remarks,
              confidence: match.confidence,
              methodology: match.reportMatch?.methodology,
            },
          });
        }
      }

      await this.updateJobStatus(jobId, AIJobStatus.COMPLETED, result);
      return result;
    } catch (error) {
      await this.updateJobStatus(jobId, AIJobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  @Process('detect-anomalies')
  async handleAnomalyDetection(job: Job) {
    const { jobId, productId } = job.data;

    try {
      await this.updateJobStatus(jobId, AIJobStatus.PROCESSING);

      // Get product data with claims and validations
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          claims: true,
          validations: {
            include: {
              claims: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      const result = await this.anomalyDetector.detectAnomalies({
        productId,
        claims: product.claims,
        validations: product.validations,
        nutritionalData: this.extractNutritionalData(product.claims),
      });

      // Store anomaly results
      if (result.anomalies.length > 0) {
        await this.prisma.activityLog.create({
          data: {
            action: 'ANOMALY_DETECTED',
            entity: 'Product',
            entityId: productId,
            metadata: {
              anomalies: result.anomalies,
              riskScore: result.riskScore,
              recommendations: result.recommendations,
            },
          },
        });
      }

      await this.updateJobStatus(jobId, AIJobStatus.COMPLETED, result);
      return result;
    } catch (error) {
      await this.updateJobStatus(jobId, AIJobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: AIJobStatus,
    output?: any,
    error?: string,
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === AIJobStatus.PROCESSING) {
      updateData.startedAt = new Date();
    } else if (status === AIJobStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.output = output;
    } else if (status === AIJobStatus.FAILED) {
      updateData.completedAt = new Date();
      updateData.error = error;
    }

    await this.prisma.aIAnalysisJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  private extractNutritionalData(claims: any[]) {
    const nutritionalData: any = {};

    claims.forEach(claim => {
      if (claim.type === 'NUTRITIONAL') {
        const key = claim.category.toLowerCase().replace(/\s+/g, '_');
        nutritionalData[key] = parseFloat(claim.value) || 0;
      }
    });

    return nutritionalData;
  }
}