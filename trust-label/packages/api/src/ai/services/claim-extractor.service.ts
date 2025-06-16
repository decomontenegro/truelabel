import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ClaimExtractorService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('openai.apiKey'),
    });
  }

  async extractFromImage(imageUrl: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting nutritional and health claims from product labels. 
            Extract all claims, nutritional information, certifications, and ingredients from the product label image.
            Return the data in a structured JSON format with the following categories:
            - nutritional_claims (calories, proteins, carbs, fats, vitamins, minerals)
            - health_claims (any health benefits mentioned)
            - certifications (organic, non-GMO, etc.)
            - allergens
            - ingredients
            Be precise with values and units.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all claims and information from this product label:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      const extractedData = JSON.parse(content);

      // Transform to our claim format
      const claims = [];

      // Process nutritional claims
      if (extractedData.nutritional_claims) {
        Object.entries(extractedData.nutritional_claims).forEach(([key, value]: [string, any]) => {
          claims.push({
            type: 'NUTRITIONAL',
            category: 'Nutritional Information',
            name: key,
            value: value.amount || value,
            unit: value.unit || '',
            confidence: 0.9,
          });
        });
      }

      // Process health claims
      if (extractedData.health_claims) {
        extractedData.health_claims.forEach((claim: string) => {
          claims.push({
            type: 'HEALTH',
            category: 'Health Benefits',
            name: claim,
            value: 'true',
            confidence: 0.85,
          });
        });
      }

      // Process certifications
      if (extractedData.certifications) {
        extractedData.certifications.forEach((cert: string) => {
          claims.push({
            type: 'CERTIFICATION',
            category: 'Certifications',
            name: cert,
            value: 'certified',
            confidence: 0.95,
          });
        });
      }

      // Process allergens
      if (extractedData.allergens) {
        extractedData.allergens.forEach((allergen: string) => {
          claims.push({
            type: 'ALLERGEN',
            category: 'Allergen Information',
            name: allergen,
            value: 'contains',
            confidence: 0.95,
          });
        });
      }

      return {
        success: true,
        claims,
        rawData: extractedData,
        metadata: {
          extractedAt: new Date(),
          model: 'gpt-4-vision-preview',
          imageUrl,
        },
      };
    } catch (error) {
      console.error('Error extracting claims:', error);
      return {
        success: false,
        error: error.message,
        claims: [],
      };
    }
  }

  async extractFromText(text: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Extract nutritional and health claims from the provided text.
            Return structured JSON with nutritional_claims, health_claims, certifications, and allergens.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error extracting from text:', error);
      throw error;
    }
  }
}