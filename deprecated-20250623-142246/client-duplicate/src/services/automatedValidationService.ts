import api from './api';
import { reportService } from './reportService';
import { validationService } from './validationService';
import { notificationService } from './notificationService';
import { qrService } from './qrService';
import {
  Validation,
  ValidationStatus,
  DataPointValidation,
  AnalysisResult,
  AnalysisFinding,
  ValidationFeedback,
  Report,
  CreateValidationData,
  ValidationQueue
} from '@/types';

export interface ValidationWorkflowState {
  QUEUED: 'QUEUED';
  ANALYZING: 'ANALYZING';
  VALIDATING: 'VALIDATING';
  REVIEW_REQUIRED: 'REVIEW_REQUIRED';
  COMPLETED: 'COMPLETED';
  FAILED: 'FAILED';
}

export const WorkflowStates: ValidationWorkflowState = {
  QUEUED: 'QUEUED',
  ANALYZING: 'ANALYZING',
  VALIDATING: 'VALIDATING',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

interface ValidationQueueItem {
  id: string;
  reportId: string;
  productId: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  state: keyof ValidationWorkflowState;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  validationId?: string;
}

interface ParsedReportData {
  dataPoints: Array<{
    name: string;
    value: any;
    unit?: string;
    category: string;
  }>;
  claims: string[];
  certifications?: string[];
  testMethods?: string[];
  sampleInfo?: {
    collectionDate?: string;
    batchNumber?: string;
    testDate?: string;
  };
}

interface ValidationRuleResult {
  passed: boolean;
  confidence: number;
  notes?: string;
  warnings?: string[];
}

class AutomatedValidationService {
  private processingQueue: ValidationQueueItem[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly CONFIDENCE_THRESHOLD = 85; // Minimum confidence for auto-approval
  private readonly PROCESSING_INTERVAL = 5000; // Process queue every 5 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Start the automated queue processor
   */
  private startQueueProcessor() {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processValidationQueue();
      }
    }, this.PROCESSING_INTERVAL);
  }

  /**
   * Stop the queue processor
   */
  public stopQueueProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Add a validation request to the queue
   */
  public async queueValidation(
    reportId: string,
    productId: string,
    priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL'
  ): Promise<string> {
    const queueItem: ValidationQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      productId,
      priority,
      state: WorkflowStates.QUEUED,
      attempts: 0,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
      createdAt: new Date()
    };

    // Add to queue based on priority
    if (priority === 'URGENT') {
      this.processingQueue.unshift(queueItem);
    } else {
      this.processingQueue.push(queueItem);
      // Sort by priority
      this.processingQueue.sort((a, b) => {
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }

    // Notify about queued validation
    await notificationService.create({
      title: 'Validation Queued',
      message: `Report validation has been queued for processing (Priority: ${priority})`,
      type: 'info',
      userId: 'system'
    });

    return queueItem.id;
  }

  /**
   * Process the validation queue
   */
  public async processValidationQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Get next item from queue
      const queueItem = this.processingQueue.find(
        item => item.state === WorkflowStates.QUEUED && item.attempts < item.maxAttempts
      );

      if (!queueItem) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing validation ${queueItem.id} (Attempt ${queueItem.attempts + 1})`);

      queueItem.processingStartedAt = new Date();
      queueItem.attempts++;

      try {
        // Update state to ANALYZING
        queueItem.state = WorkflowStates.ANALYZING;
        const analysis = await this.analyzeReport(queueItem.reportId);

        // Update state to VALIDATING
        queueItem.state = WorkflowStates.VALIDATING;
        const validation = await this.createAutomatedValidation(
          analysis,
          queueItem.productId,
          queueItem.reportId
        );

        // Check if manual review is required
        if (analysis.confidence < this.CONFIDENCE_THRESHOLD) {
          queueItem.state = WorkflowStates.REVIEW_REQUIRED;
          
          await notificationService.create({
            title: 'Manual Review Required',
            message: `Validation confidence (${analysis.confidence}%) is below threshold. Manual review required.`,
            type: 'warning',
            userId: 'system'
          });
        } else {
          queueItem.state = WorkflowStates.COMPLETED;
          queueItem.completedAt = new Date();
          queueItem.validationId = validation.id;

          // Generate QR code for validated product
          await qrService.generateQRCode(queueItem.productId);

          await notificationService.create({
            title: 'Validation Completed',
            message: `Automated validation completed successfully with ${analysis.confidence}% confidence`,
            type: 'success',
            userId: 'system'
          });
        }

        // Remove completed item from queue
        this.processingQueue = this.processingQueue.filter(item => item.id !== queueItem.id);

      } catch (error) {
        console.error(`Error processing validation ${queueItem.id}:`, error);
        queueItem.lastError = error instanceof Error ? error.message : 'Unknown error';
        queueItem.state = WorkflowStates.QUEUED; // Reset to queued for retry

        if (queueItem.attempts >= queueItem.maxAttempts) {
          queueItem.state = WorkflowStates.FAILED;
          
          await notificationService.create({
            title: 'Validation Failed',
            message: `Failed to process validation after ${queueItem.maxAttempts} attempts: ${queueItem.lastError}`,
            type: 'error',
            userId: 'system'
          });

          // Remove failed item from queue
          this.processingQueue = this.processingQueue.filter(item => item.id !== queueItem.id);
        }
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze uploaded report
   */
  public async analyzeReport(reportId: string): Promise<AnalysisResult> {
    try {
      // Get report details
      const report = await reportService.getById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Parse report data
      const parsedData = await this.parseReportData(report);

      // Analyze data points
      const findings = await this.analyzeDataPoints(parsedData);

      // Calculate overall confidence
      const confidence = this.calculateConfidence(findings);

      // Generate recommendations
      const recommendations = this.generateRecommendations(findings);

      const analysisResult: AnalysisResult = {
        id: `analysis-${Date.now()}`,
        timestamp: new Date().toISOString(),
        algorithm: 'TrueLabel-AutoValidator-v1.0',
        version: '1.0.0',
        findings,
        recommendations,
        confidence,
        processingTime: Date.now()
      };

      return analysisResult;

    } catch (error) {
      console.error('Error analyzing report:', error);
      throw error;
    }
  }

  /**
   * Parse report data into structured format
   */
  private async parseReportData(report: Report): Promise<ParsedReportData> {
    // This is a simplified parser - in production, you'd use advanced parsing
    // techniques like OCR, ML models, or specific format parsers
    
    const results = report.results || {};
    
    const parsedData: ParsedReportData = {
      dataPoints: [],
      claims: [],
      certifications: results.certifications || [],
      testMethods: results.testMethods || [],
      sampleInfo: results.sampleInfo || {}
    };

    // Extract nutritional data points
    if (results.nutritionalInfo) {
      Object.entries(results.nutritionalInfo).forEach(([key, value]: [string, any]) => {
        parsedData.dataPoints.push({
          name: key,
          value: value.value || value,
          unit: value.unit || '',
          category: 'nutritional'
        });
      });
    }

    // Extract chemical analysis data points
    if (results.chemicalAnalysis) {
      Object.entries(results.chemicalAnalysis).forEach(([key, value]: [string, any]) => {
        parsedData.dataPoints.push({
          name: key,
          value: value.value || value,
          unit: value.unit || '',
          category: 'chemical'
        });
      });
    }

    // Extract microbiological data points
    if (results.microbiological) {
      Object.entries(results.microbiological).forEach(([key, value]: [string, any]) => {
        parsedData.dataPoints.push({
          name: key,
          value: value.value || value,
          unit: value.unit || 'CFU/g',
          category: 'microbiological'
        });
      });
    }

    // Extract claims from report
    if (results.claims) {
      parsedData.claims = Array.isArray(results.claims) 
        ? results.claims 
        : results.claims.split(',').map((c: string) => c.trim());
    }

    return parsedData;
  }

  /**
   * Analyze data points and generate findings
   */
  private async analyzeDataPoints(parsedData: ParsedReportData): Promise<AnalysisFinding[]> {
    const findings: AnalysisFinding[] = [];

    // Analyze each data point against validation rules
    for (const dataPoint of parsedData.dataPoints) {
      const ruleResult = await this.applyValidationRules(dataPoint);

      if (!ruleResult.passed) {
        findings.push({
          category: 'COMPLIANCE',
          severity: 'HIGH',
          dataPoint: dataPoint.name,
          description: `Value ${dataPoint.value} ${dataPoint.unit} does not meet requirements`,
          evidence: JSON.stringify(dataPoint),
          suggestedAction: 'Review and update product formulation or retest'
        });
      } else if (ruleResult.warnings && ruleResult.warnings.length > 0) {
        findings.push({
          category: 'ACCURACY',
          severity: 'MEDIUM',
          dataPoint: dataPoint.name,
          description: ruleResult.warnings.join(', '),
          evidence: JSON.stringify(dataPoint),
          suggestedAction: 'Monitor this parameter closely'
        });
      }
    }

    // Check for data consistency
    const consistencyIssues = this.checkDataConsistency(parsedData);
    findings.push(...consistencyIssues);

    // Check for anomalies
    const anomalies = this.detectAnomalies(parsedData);
    findings.push(...anomalies);

    return findings;
  }

  /**
   * Apply validation rules to a data point
   */
  private async applyValidationRules(dataPoint: any): Promise<ValidationRuleResult> {
    // Simplified rule engine - in production, this would be more sophisticated
    const rules: Record<string, { min?: number; max?: number; warning?: number }> = {
      'protein': { min: 0, max: 100, warning: 90 },
      'fat': { min: 0, max: 100, warning: 90 },
      'carbohydrates': { min: 0, max: 100, warning: 90 },
      'sodium': { min: 0, max: 5000, warning: 2300 }, // mg per 100g
      'sugar': { min: 0, max: 100, warning: 50 },
      'fiber': { min: 0, max: 100 },
      'calories': { min: 0, max: 900 }, // per 100g
      'coliformCount': { min: 0, max: 100 }, // CFU/g
      'salmonella': { max: 0 }, // Must be absent
      'listeria': { max: 0 }, // Must be absent
    };

    const rule = rules[dataPoint.name.toLowerCase()];
    if (!rule) {
      return { passed: true, confidence: 100 };
    }

    const value = parseFloat(dataPoint.value);
    const warnings: string[] = [];
    let passed = true;
    let confidence = 100;

    if (rule.min !== undefined && value < rule.min) {
      passed = false;
      confidence = 0;
    }

    if (rule.max !== undefined && value > rule.max) {
      passed = false;
      confidence = 0;
    }

    if (passed && rule.warning !== undefined && value > rule.warning) {
      warnings.push(`Value approaching upper limit (${rule.warning} ${dataPoint.unit})`);
      confidence = 80;
    }

    return { passed, confidence, warnings };
  }

  /**
   * Check data consistency
   */
  private checkDataConsistency(parsedData: ParsedReportData): AnalysisFinding[] {
    const findings: AnalysisFinding[] = [];

    // Check macronutrient sum
    const protein = parsedData.dataPoints.find(d => d.name.toLowerCase() === 'protein')?.value || 0;
    const fat = parsedData.dataPoints.find(d => d.name.toLowerCase() === 'fat')?.value || 0;
    const carbs = parsedData.dataPoints.find(d => d.name.toLowerCase() === 'carbohydrates')?.value || 0;
    const sum = parseFloat(protein) + parseFloat(fat) + parseFloat(carbs);

    if (sum > 100) {
      findings.push({
        category: 'CONSISTENCY',
        severity: 'HIGH',
        dataPoint: 'macronutrients',
        description: `Sum of macronutrients (${sum.toFixed(1)}%) exceeds 100%`,
        evidence: `Protein: ${protein}%, Fat: ${fat}%, Carbs: ${carbs}%`,
        suggestedAction: 'Verify analytical methods and recalculate values'
      });
    }

    // Check caloric consistency
    const calories = parsedData.dataPoints.find(d => d.name.toLowerCase() === 'calories')?.value || 0;
    const expectedCalories = (parseFloat(protein) * 4) + (parseFloat(fat) * 9) + (parseFloat(carbs) * 4);
    const calorieDeviation = Math.abs(parseFloat(calories) - expectedCalories) / expectedCalories * 100;

    if (calorieDeviation > 10) {
      findings.push({
        category: 'CONSISTENCY',
        severity: 'MEDIUM',
        dataPoint: 'calories',
        description: `Caloric value deviates ${calorieDeviation.toFixed(1)}% from expected`,
        evidence: `Reported: ${calories} kcal, Expected: ${expectedCalories.toFixed(0)} kcal`,
        suggestedAction: 'Verify caloric calculation method'
      });
    }

    return findings;
  }

  /**
   * Detect anomalies in data
   */
  private detectAnomalies(parsedData: ParsedReportData): AnalysisFinding[] {
    const findings: AnalysisFinding[] = [];

    // Check for unusual patterns
    parsedData.dataPoints.forEach(dataPoint => {
      // Check for extremely precise values (potential data entry error)
      if (dataPoint.value && dataPoint.value.toString().includes('.') && 
          dataPoint.value.toString().split('.')[1].length > 4) {
        findings.push({
          category: 'ANOMALY',
          severity: 'LOW',
          dataPoint: dataPoint.name,
          description: 'Unusually precise value detected',
          evidence: `Value: ${dataPoint.value}`,
          suggestedAction: 'Verify measurement precision and rounding rules'
        });
      }

      // Check for placeholder values
      if (dataPoint.value === 0 || dataPoint.value === 999 || dataPoint.value === 9999) {
        findings.push({
          category: 'ANOMALY',
          severity: 'MEDIUM',
          dataPoint: dataPoint.name,
          description: 'Potential placeholder value detected',
          evidence: `Value: ${dataPoint.value}`,
          suggestedAction: 'Confirm this is the actual measured value'
        });
      }
    });

    return findings;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(findings: AnalysisFinding[]): number {
    if (findings.length === 0) return 100;

    const severityWeights = {
      HIGH: 20,
      MEDIUM: 10,
      LOW: 5,
      INFO: 2
    };

    const totalPenalty = findings.reduce((sum, finding) => {
      return sum + severityWeights[finding.severity];
    }, 0);

    // Ensure confidence doesn't go below 0
    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: AnalysisFinding[]): string[] {
    const recommendations: string[] = [];
    
    const highSeverityCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumSeverityCount = findings.filter(f => f.severity === 'MEDIUM').length;

    if (highSeverityCount > 0) {
      recommendations.push(`Address ${highSeverityCount} critical compliance issues before approval`);
    }

    if (mediumSeverityCount > 0) {
      recommendations.push(`Review ${mediumSeverityCount} moderate issues for potential improvement`);
    }

    // Category-specific recommendations
    const categories = [...new Set(findings.map(f => f.category))];
    
    if (categories.includes('CONSISTENCY')) {
      recommendations.push('Implement data validation checks to ensure consistency across measurements');
    }

    if (categories.includes('ANOMALY')) {
      recommendations.push('Review data collection and entry procedures to prevent anomalies');
    }

    if (categories.includes('COMPLIANCE')) {
      recommendations.push('Consider reformulation or additional testing to meet compliance requirements');
    }

    if (recommendations.length === 0) {
      recommendations.push('Product meets all validation criteria. Continue with regular monitoring.');
    }

    return recommendations;
  }

  /**
   * Create automated validation based on analysis
   */
  public async createAutomatedValidation(
    analysis: AnalysisResult,
    productId: string,
    reportId?: string
  ): Promise<Validation> {
    // Convert findings to data points
    const dataPoints: DataPointValidation[] = analysis.findings.map(finding => ({
      dataPointId: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: finding.dataPoint,
      value: finding.evidence,
      validationStatus: finding.severity === 'HIGH' ? 'FAILED' : 
                       finding.severity === 'MEDIUM' ? 'WARNING' : 'PASSED',
      notes: finding.description,
      source: 'AUTOMATED_ANALYSIS'
    }));

    // Determine validation status
    const status = this.determineValidationStatus(dataPoints, analysis.confidence);

    // Create validation data
    const validationData: CreateValidationData = {
      productId,
      reportId,
      type: 'AUTOMATED',
      status,
      claimsValidated: {
        automated: true,
        confidence: analysis.confidence,
        algorithm: analysis.algorithm,
        version: analysis.version,
        findingsCount: analysis.findings.length
      },
      dataPoints,
      summary: this.generateValidationSummary(analysis),
      notes: analysis.recommendations.join('\n'),
      lifecycle: {
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        formulaVersion: '1.0',
        renewalRequired: true,
        expiryWarningDays: 30,
        autoRenew: false
      }
    };

    // Create validation
    const validation = await validationService.create(validationData);

    // Store analysis result with validation
    await api.patch(`/validations/${validation.id}`, {
      automatedAnalysis: analysis,
      confidence: analysis.confidence
    });

    return validation;
  }

  /**
   * Determine validation status based on data points
   */
  public determineValidationStatus(
    dataPoints: DataPointValidation[],
    confidence: number
  ): ValidationStatus {
    const failedCount = dataPoints.filter(dp => dp.validationStatus === 'FAILED').length;
    const warningCount = dataPoints.filter(dp => dp.validationStatus === 'WARNING').length;
    const totalCount = dataPoints.length;

    if (failedCount > 0) {
      return ValidationStatus.REJECTED;
    }

    if (confidence < this.CONFIDENCE_THRESHOLD) {
      return ValidationStatus.PENDING; // Requires manual review
    }

    if (warningCount > totalCount * 0.3) {
      return ValidationStatus.PARTIAL;
    }

    if (warningCount > 0) {
      return ValidationStatus.APPROVED; // Approved with warnings
    }

    return ValidationStatus.APPROVED;
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(analysis: AnalysisResult): string {
    const findingsByCategory = analysis.findings.reduce((acc, finding) => {
      acc[finding.category] = (acc[finding.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = [
      `Automated validation completed with ${analysis.confidence}% confidence.`,
      `Processed in ${analysis.processingTime}ms using ${analysis.algorithm} v${analysis.version}.`,
      '',
      'Findings Summary:'
    ];

    Object.entries(findingsByCategory).forEach(([category, count]) => {
      summary.push(`- ${category}: ${count} issue(s)`);
    });

    if (analysis.recommendations.length > 0) {
      summary.push('', 'Key Recommendations:');
      analysis.recommendations.slice(0, 3).forEach((rec, index) => {
        summary.push(`${index + 1}. ${rec}`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Generate feedback for brand
   */
  public async generateFeedback(validation: Validation): Promise<ValidationFeedback[]> {
    const feedback: ValidationFeedback[] = [];

    // Generate feedback based on validation results
    if (validation.status === ValidationStatus.REJECTED) {
      feedback.push({
        id: `feedback-${Date.now()}-1`,
        userId: 'system',
        userName: 'Automated Validation System',
        type: 'CORRECTION',
        message: 'Your product validation was rejected. Please address the identified issues and resubmit.',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }

    if (validation.status === ValidationStatus.PARTIAL) {
      feedback.push({
        id: `feedback-${Date.now()}-2`,
        userId: 'system',
        userName: 'Automated Validation System',
        type: 'SUGGESTION',
        message: 'Your product received partial validation. Consider addressing the warnings to achieve full validation.',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }

    // Add specific feedback for failed data points
    if (validation.dataPoints) {
      validation.dataPoints
        .filter(dp => dp.validationStatus === 'FAILED')
        .forEach((dp, index) => {
          feedback.push({
            id: `feedback-${Date.now()}-${index + 3}`,
            userId: 'system',
            userName: 'Automated Validation System',
            type: 'CORRECTION',
            message: `Data point "${dp.name}" failed validation: ${dp.notes || 'Does not meet requirements'}`,
            dataPointId: dp.dataPointId,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          });
        });
    }

    return feedback;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    totalItems: number;
    byState: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byState = this.processingQueue.reduce((acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = this.processingQueue.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems: this.processingQueue.length,
      byState,
      byPriority
    };
  }

  /**
   * Get queue item details
   */
  public getQueueItem(queueId: string): ValidationQueueItem | undefined {
    return this.processingQueue.find(item => item.id === queueId);
  }

  /**
   * Cancel a queued validation
   */
  public cancelQueuedValidation(queueId: string): boolean {
    const index = this.processingQueue.findIndex(item => item.id === queueId);
    if (index !== -1 && this.processingQueue[index].state === WorkflowStates.QUEUED) {
      this.processingQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Retry failed validation
   */
  public retryFailedValidation(queueId: string): boolean {
    const item = this.processingQueue.find(item => item.id === queueId);
    if (item && item.state === WorkflowStates.FAILED) {
      item.state = WorkflowStates.QUEUED;
      item.attempts = 0;
      item.lastError = undefined;
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const automatedValidationService = new AutomatedValidationService();

// Export types
export type { ValidationQueueItem, ParsedReportData, ValidationRuleResult };