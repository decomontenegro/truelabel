import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as pdf from 'pdf-parse';
import axios from 'axios';

@Injectable()
export class ReportParserService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('openai.apiKey'),
    });
  }

  async parseReport(reportUrl: string) {
    try {
      // Download the PDF
      const response = await axios.get(reportUrl, {
        responseType: 'arraybuffer',
      });

      // Extract text from PDF
      const pdfData = await pdf(response.data);
      const text = pdfData.text;

      // Use AI to parse the report
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at parsing laboratory analysis reports.
            Extract all test results, methodologies, and findings from the report.
            Focus on:
            - Nutritional analysis results (with exact values and units)
            - Microbiological tests
            - Heavy metals analysis
            - Allergen tests
            - Pesticide/herbicide residues
            - Any other relevant test results
            
            Return structured JSON with categories matching the test types.
            Include the methodology used for each test.`,
          },
          {
            role: 'user',
            content: `Parse this laboratory report and extract all test results:\n\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4000,
      });

      const parsedData = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');

      // Transform to standardized format
      const results = [];

      // Process each category of results
      Object.entries(parsedData).forEach(([category, tests]: [string, any]) => {
        if (typeof tests === 'object') {
          Object.entries(tests).forEach(([testName, testData]: [string, any]) => {
            results.push({
              category,
              name: testName,
              value: testData.value || testData.result || testData,
              unit: testData.unit || '',
              methodology: testData.method || testData.methodology || '',
              status: this.determineStatus(testData),
              limits: testData.limits || testData.reference || null,
            });
          });
        }
      });

      return {
        success: true,
        results,
        metadata: {
          reportUrl,
          parsedAt: new Date(),
          totalTests: results.length,
          documentInfo: {
            pages: pdfData.numpages,
            info: pdfData.info,
          },
        },
        rawData: parsedData,
      };
    } catch (error) {
      console.error('Error parsing report:', error);
      return {
        success: false,
        error: error.message,
        results: [],
      };
    }
  }

  private determineStatus(testData: any): string {
    // Determine if test result is within acceptable limits
    if (testData.status) return testData.status;
    
    if (testData.value && testData.limits) {
      const value = parseFloat(testData.value);
      const max = parseFloat(testData.limits.max || testData.limits.maximum);
      const min = parseFloat(testData.limits.min || testData.limits.minimum);

      if (!isNaN(value)) {
        if (!isNaN(max) && value > max) return 'above_limit';
        if (!isNaN(min) && value < min) return 'below_limit';
        return 'within_limits';
      }
    }

    return 'unknown';
  }

  async extractMethodologies(reportText: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract all analytical methodologies mentioned in the report. Return as a JSON array of strings.',
          },
          {
            role: 'user',
            content: reportText,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result.methodologies || [];
    } catch (error) {
      console.error('Error extracting methodologies:', error);
      return [];
    }
  }
}