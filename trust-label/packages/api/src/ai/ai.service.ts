import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimExtractorService } from './services/claim-extractor.service';
import { ReportParserService } from './services/report-parser.service';
import { ValidationMatcherService } from './services/validation-matcher.service';
import { AnomalyDetectorService } from './services/anomaly-detector.service';
import { AIJobType } from '@prisma/client';

@Injectable()
export class AIService {
  constructor(
    @InjectQueue('ai-analysis') private aiQueue: Queue,
    private prisma: PrismaService,
    private claimExtractor: ClaimExtractorService,
    private reportParser: ReportParserService,
    private validationMatcher: ValidationMatcherService,
    private anomalyDetector: AnomalyDetectorService,
  ) {}

  async extractClaimsFromImage(imageUrl: string, productId: string) {
    // Create job record
    const job = await this.prisma.aIAnalysisJob.create({
      data: {
        type: AIJobType.CLAIM_EXTRACTION,
        input: { imageUrl, productId },
      },
    });

    // Queue for processing
    await this.aiQueue.add('extract-claims', {
      jobId: job.id,
      imageUrl,
      productId,
    });

    return job;
  }

  async parseLabReport(reportUrl: string, validationId: string) {
    const job = await this.prisma.aIAnalysisJob.create({
      data: {
        type: AIJobType.REPORT_PARSING,
        input: { reportUrl, validationId },
      },
    });

    await this.aiQueue.add('parse-report', {
      jobId: job.id,
      reportUrl,
      validationId,
    });

    return job;
  }

  async matchClaimsWithReport(productId: string, validationId: string) {
    const job = await this.prisma.aIAnalysisJob.create({
      data: {
        type: AIJobType.VALIDATION_MATCHING,
        input: { productId, validationId },
      },
    });

    await this.aiQueue.add('match-claims', {
      jobId: job.id,
      productId,
      validationId,
    });

    return job;
  }

  async detectAnomalies(productId: string) {
    const job = await this.prisma.aIAnalysisJob.create({
      data: {
        type: AIJobType.ANOMALY_DETECTION,
        input: { productId },
      },
    });

    await this.aiQueue.add('detect-anomalies', {
      jobId: job.id,
      productId,
    });

    return job;
  }

  async getJobStatus(jobId: string) {
    return this.prisma.aIAnalysisJob.findUnique({
      where: { id: jobId },
    });
  }

  // Direct service methods for immediate processing
  async extractClaimsSync(imageUrl: string) {
    return this.claimExtractor.extractFromImage(imageUrl);
  }

  async parseReportSync(reportUrl: string) {
    return this.reportParser.parseReport(reportUrl);
  }

  async matchClaimsSync(claims: any[], reportData: any[]) {
    return this.validationMatcher.matchClaimsWithReport(claims, reportData);
  }

  async detectAnomaliesSync(data: any) {
    return this.anomalyDetector.detectAnomalies(data);
  }

  async calculateConfidenceScore(validationData: any) {
    // AI-based confidence scoring
    const factors = {
      labAccreditation: 0.3,
      methodologyMatch: 0.25,
      valueProximity: 0.25,
      reportRecency: 0.1,
      historicalAccuracy: 0.1,
    };

    let score = 0;

    // Lab accreditation score
    if (validationData.laboratory?.accreditation?.length > 0) {
      score += factors.labAccreditation;
    }

    // Methodology match score
    if (validationData.methodology === validationData.expectedMethodology) {
      score += factors.methodologyMatch;
    }

    // Value proximity score (within 5% tolerance)
    const tolerance = 0.05;
    const valueDiff = Math.abs(
      (validationData.actualValue - validationData.claimedValue) / validationData.claimedValue
    );
    if (valueDiff <= tolerance) {
      score += factors.valueProximity * (1 - valueDiff / tolerance);
    }

    // Report recency score (less than 6 months)
    const reportAge = Date.now() - new Date(validationData.reportDate).getTime();
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
    if (reportAge < sixMonths) {
      score += factors.reportRecency * (1 - reportAge / sixMonths);
    }

    // Historical accuracy (if available)
    if (validationData.historicalAccuracy) {
      score += factors.historicalAccuracy * validationData.historicalAccuracy;
    }

    return Math.min(score, 1); // Cap at 1.0
  }
}