import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ValidationMatcherService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('openai.apiKey'),
    });
  }

  async matchClaimsWithReport(claims: any[], reportData: any[]) {
    try {
      const matches = [];

      for (const claim of claims) {
        const match = await this.findBestMatch(claim, reportData);
        if (match) {
          matches.push({
            claimId: claim.id,
            claim: claim,
            reportMatch: match.reportData,
            confidence: match.confidence,
            status: this.determineValidationStatus(claim, match.reportData),
            remarks: match.remarks,
          });
        } else {
          matches.push({
            claimId: claim.id,
            claim: claim,
            reportMatch: null,
            confidence: 0,
            status: 'NOT_VALIDATED',
            remarks: 'No matching data found in laboratory report',
          });
        }
      }

      return {
        success: true,
        matches,
        summary: {
          totalClaims: claims.length,
          validated: matches.filter(m => m.status === 'VALIDATED').length,
          validatedWithRemarks: matches.filter(m => m.status === 'VALIDATED_WITH_REMARKS').length,
          notValidated: matches.filter(m => m.status === 'NOT_VALIDATED').length,
        },
      };
    } catch (error) {
      console.error('Error matching claims:', error);
      return {
        success: false,
        error: error.message,
        matches: [],
      };
    }
  }

  private async findBestMatch(claim: any, reportData: any[]) {
    // Use semantic search to find the best match
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are matching product claims with laboratory test results.
          Find the best matching test result for the given claim.
          Consider:
          - Semantic similarity of names
          - Unit compatibility
          - Category matching
          Return JSON with: matched (boolean), reportIndex (number), confidence (0-1), remarks (string)`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            claim: {
              name: claim.name || claim.category,
              value: claim.value,
              unit: claim.unit,
              type: claim.type,
            },
            reportData: reportData.map((r, idx) => ({
              index: idx,
              name: r.name,
              value: r.value,
              unit: r.unit,
              category: r.category,
            })),
          }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    if (result.matched && result.reportIndex !== undefined) {
      return {
        reportData: reportData[result.reportIndex],
        confidence: result.confidence || 0.8,
        remarks: result.remarks || '',
      };
    }

    return null;
  }

  private determineValidationStatus(claim: any, reportData: any): string {
    if (!reportData) return 'NOT_VALIDATED';

    const claimValue = this.parseValue(claim.value);
    const reportValue = this.parseValue(reportData.value);

    if (claimValue === null || reportValue === null) {
      return 'NOT_APPLICABLE';
    }

    // Calculate tolerance (5% for nutritional values)
    const tolerance = claim.type === 'NUTRITIONAL' ? 0.05 : 0.02;
    const difference = Math.abs(claimValue - reportValue) / claimValue;

    if (difference <= tolerance) {
      return 'VALIDATED';
    } else if (difference <= tolerance * 2) {
      return 'VALIDATED_WITH_REMARKS';
    } else {
      return 'NOT_VALIDATED';
    }
  }

  private parseValue(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  async generateValidationSummary(matches: any[]) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise validation summary for the matched claims.',
        },
        {
          role: 'user',
          content: JSON.stringify(matches),
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Validation completed.';
  }
}