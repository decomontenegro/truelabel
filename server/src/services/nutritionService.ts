import { prisma } from '../lib/prisma';
import logger from '../utils/logger';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

interface NutritionalInfo {
  energy?: number; // kcal
  protein?: number; // g
  carbohydrates?: number; // g
  sugars?: number; // g
  fat?: number; // g
  saturatedFat?: number; // g
  transFat?: number; // g
  fiber?: number; // g
  sodium?: number; // mg
  calcium?: number; // mg
  iron?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
  vitaminD?: number; // mcg
  cholesterol?: number; // mg
}

interface DailyValues {
  [nutrient: string]: {
    value: number;
    unit: string;
  };
}

interface NutritionalScore {
  overall: number; // 0-100
  breakdown: {
    positive: number;
    negative: number;
  };
  grade: string; // A, B, C, D, E
  strengths: string[];
  warnings: string[];
}

class NutritionService {
  // Daily values by country (based on official guidelines)
  private dailyValues: Record<string, DailyValues> = {
    BRAZIL: {
      energy: { value: 2000, unit: 'kcal' },
      protein: { value: 50, unit: 'g' },
      carbohydrates: { value: 300, unit: 'g' },
      sugars: { value: 50, unit: 'g' },
      fat: { value: 65, unit: 'g' },
      saturatedFat: { value: 20, unit: 'g' },
      transFat: { value: 2, unit: 'g' },
      fiber: { value: 25, unit: 'g' },
      sodium: { value: 2300, unit: 'mg' },
      calcium: { value: 1000, unit: 'mg' },
      iron: { value: 14, unit: 'mg' },
      vitaminA: { value: 600, unit: 'mcg' },
      vitaminC: { value: 45, unit: 'mg' },
      vitaminD: { value: 5, unit: 'mcg' },
      cholesterol: { value: 300, unit: 'mg' }
    },
    USA: {
      energy: { value: 2000, unit: 'kcal' },
      protein: { value: 50, unit: 'g' },
      carbohydrates: { value: 275, unit: 'g' },
      sugars: { value: 50, unit: 'g' },
      fat: { value: 78, unit: 'g' },
      saturatedFat: { value: 20, unit: 'g' },
      transFat: { value: 2, unit: 'g' },
      fiber: { value: 28, unit: 'g' },
      sodium: { value: 2300, unit: 'mg' },
      calcium: { value: 1300, unit: 'mg' },
      iron: { value: 18, unit: 'mg' },
      vitaminA: { value: 900, unit: 'mcg' },
      vitaminC: { value: 90, unit: 'mg' },
      vitaminD: { value: 20, unit: 'mcg' },
      cholesterol: { value: 300, unit: 'mg' }
    },
    EU: {
      energy: { value: 2000, unit: 'kcal' },
      protein: { value: 50, unit: 'g' },
      carbohydrates: { value: 260, unit: 'g' },
      sugars: { value: 90, unit: 'g' },
      fat: { value: 70, unit: 'g' },
      saturatedFat: { value: 20, unit: 'g' },
      transFat: { value: 2, unit: 'g' },
      fiber: { value: 25, unit: 'g' },
      sodium: { value: 2000, unit: 'mg' },
      calcium: { value: 800, unit: 'mg' },
      iron: { value: 14, unit: 'mg' },
      vitaminA: { value: 800, unit: 'mcg' },
      vitaminC: { value: 80, unit: 'mg' },
      vitaminD: { value: 5, unit: 'mcg' },
      cholesterol: { value: 300, unit: 'mg' }
    }
  };

  /**
   * Get daily values by country
   */
  async getDailyValuesByCountry(country: string): Promise<DailyValues | null> {
    const cacheKey = `nutrition:daily-values:${country}`;
    
    // Try cache first
    const cached = await cacheService.get<DailyValues>('nutrition', cacheKey);
    if (cached) return cached;

    const values = this.dailyValues[country] || this.dailyValues['BRAZIL'];
    
    // Cache for 24 hours
    await cacheService.set('nutrition', cacheKey, values, { ttl: CacheTTL.LONG });
    
    return values;
  }

  /**
   * Calculate nutritional score
   */
  async calculateScore(params: {
    nutritionalInfo: NutritionalInfo;
    servingSize: number;
    country: string;
  }): Promise<NutritionalScore> {
    const { nutritionalInfo, servingSize, country } = params;
    const dailyValues = await this.getDailyValuesByCountry(country);
    
    if (!dailyValues) {
      throw new Error('Daily values not found for country');
    }

    let positiveScore = 0;
    let negativeScore = 0;
    const strengths: string[] = [];
    const warnings: string[] = [];

    // Positive nutrients (higher is better)
    if (nutritionalInfo.fiber) {
      const fiberPercent = (nutritionalInfo.fiber / dailyValues.fiber.value) * 100;
      if (fiberPercent >= 20) {
        positiveScore += 20;
        strengths.push('Alto teor de fibras');
      } else {
        positiveScore += fiberPercent;
      }
    }

    if (nutritionalInfo.protein) {
      const proteinPercent = (nutritionalInfo.protein / dailyValues.protein.value) * 100;
      if (proteinPercent >= 20) {
        positiveScore += 15;
        strengths.push('Rica fonte de proteína');
      } else {
        positiveScore += proteinPercent * 0.75;
      }
    }

    // Vitamins and minerals
    if (nutritionalInfo.vitaminC) {
      const vitCPercent = (nutritionalInfo.vitaminC / dailyValues.vitaminC.value) * 100;
      if (vitCPercent >= 30) {
        positiveScore += 10;
        strengths.push('Fonte de vitamina C');
      }
    }

    if (nutritionalInfo.calcium) {
      const calciumPercent = (nutritionalInfo.calcium / dailyValues.calcium.value) * 100;
      if (calciumPercent >= 15) {
        positiveScore += 10;
        strengths.push('Fonte de cálcio');
      }
    }

    // Negative nutrients (lower is better)
    if (nutritionalInfo.saturatedFat) {
      const satFatPercent = (nutritionalInfo.saturatedFat / dailyValues.saturatedFat.value) * 100;
      if (satFatPercent > 20) {
        negativeScore += 20;
        warnings.push('Alto teor de gordura saturada');
      } else {
        negativeScore += satFatPercent;
      }
    }

    if (nutritionalInfo.transFat && nutritionalInfo.transFat > 0) {
      negativeScore += 25;
      warnings.push('Contém gordura trans');
    }

    if (nutritionalInfo.sugars) {
      const sugarPercent = (nutritionalInfo.sugars / dailyValues.sugars.value) * 100;
      if (sugarPercent > 15) {
        negativeScore += 15;
        warnings.push('Alto teor de açúcares');
      } else {
        negativeScore += sugarPercent;
      }
    }

    if (nutritionalInfo.sodium) {
      const sodiumPercent = (nutritionalInfo.sodium / dailyValues.sodium.value) * 100;
      if (sodiumPercent > 20) {
        negativeScore += 20;
        warnings.push('Alto teor de sódio');
      } else {
        negativeScore += sodiumPercent;
      }
    }

    // Calculate overall score
    const overall = Math.max(0, Math.min(100, positiveScore - negativeScore + 50));
    
    // Determine grade
    let grade: string;
    if (overall >= 80) grade = 'A';
    else if (overall >= 65) grade = 'B';
    else if (overall >= 50) grade = 'C';
    else if (overall >= 35) grade = 'D';
    else grade = 'E';

    return {
      overall,
      breakdown: {
        positive: positiveScore,
        negative: negativeScore
      },
      grade,
      strengths,
      warnings
    };
  }

  /**
   * Analyze nutrition and provide recommendations
   */
  async analyzeNutrition(params: {
    nutritionalInfo: NutritionalInfo;
    category?: string;
    targetAudience: string;
  }) {
    const { nutritionalInfo, category, targetAudience } = params;
    const score = await this.calculateScore({
      nutritionalInfo,
      servingSize: 100,
      country: 'BRAZIL'
    });

    const recommendations: string[] = [];
    const highlights: string[] = [];
    const concerns: string[] = [];

    // Target audience specific analysis
    if (targetAudience === 'children') {
      if (nutritionalInfo.sugars && nutritionalInfo.sugars > 10) {
        concerns.push('Alto teor de açúcar para crianças');
        recommendations.push('Considere reduzir o teor de açúcar');
      }
      if (nutritionalInfo.calcium && nutritionalInfo.calcium > 200) {
        highlights.push('Bom para desenvolvimento ósseo infantil');
      }
    }

    if (targetAudience === 'elderly') {
      if (nutritionalInfo.fiber && nutritionalInfo.fiber > 5) {
        highlights.push('Adequado para digestão em idosos');
      }
      if (nutritionalInfo.sodium && nutritionalInfo.sodium > 400) {
        concerns.push('Alto teor de sódio - cuidado com pressão arterial');
      }
    }

    if (targetAudience === 'athletes') {
      if (nutritionalInfo.protein && nutritionalInfo.protein > 15) {
        highlights.push('Boa fonte de proteína para atletas');
      }
      if (nutritionalInfo.carbohydrates && nutritionalInfo.carbohydrates > 30) {
        highlights.push('Fonte de energia para exercícios');
      }
    }

    // General recommendations
    if (score.warnings.length > 2) {
      recommendations.push('Considere reformular o produto para melhorar o perfil nutricional');
    }

    if (score.grade === 'A' || score.grade === 'B') {
      highlights.push('Produto com excelente perfil nutricional');
    }

    return {
      score,
      targetAudienceAnalysis: {
        suitable: score.overall >= 50,
        highlights,
        concerns,
        recommendations
      },
      complianceStatus: {
        brazil: this.checkBrazilianCompliance(nutritionalInfo),
        general: score.warnings.length === 0
      }
    };
  }

  /**
   * Validate nutritional claims
   */
  async validateClaims(params: {
    nutritionalInfo: NutritionalInfo;
    claims: string[];
    country: string;
  }) {
    const { nutritionalInfo, claims, country } = params;
    const dailyValues = await this.getDailyValuesByCountry(country);
    
    const results = claims.map(claim => {
      const validation = this.validateSingleClaim(claim, nutritionalInfo, dailyValues!);
      return {
        claim,
        ...validation
      };
    });

    const allValid = results.every(r => r.valid);
    const validCount = results.filter(r => r.valid).length;

    return {
      overallValid: allValid,
      validationRate: (validCount / claims.length) * 100,
      results,
      recommendations: this.getClaimRecommendations(results)
    };
  }

  /**
   * Compare nutritional profiles
   */
  async compareProducts(products: Array<{ id: string; nutritionalInfo: NutritionalInfo }>) {
    const scores = await Promise.all(
      products.map(async (product) => {
        const score = await this.calculateScore({
          nutritionalInfo: product.nutritionalInfo,
          servingSize: 100,
          country: 'BRAZIL'
        });
        return {
          productId: product.id,
          score,
          nutritionalInfo: product.nutritionalInfo
        };
      })
    );

    // Sort by overall score
    scores.sort((a, b) => b.score.overall - a.score.overall);

    // Calculate averages
    const avgNutrients = this.calculateAverageNutrients(products.map(p => p.nutritionalInfo));

    return {
      ranking: scores.map((s, index) => ({
        rank: index + 1,
        productId: s.productId,
        score: s.score.overall,
        grade: s.score.grade
      })),
      comparison: {
        best: scores[0],
        worst: scores[scores.length - 1],
        averages: avgNutrients
      },
      insights: this.generateComparisonInsights(scores)
    };
  }

  /**
   * Private helper methods
   */
  private checkBrazilianCompliance(nutritionalInfo: NutritionalInfo): boolean {
    // Basic compliance check based on Brazilian regulations
    if (nutritionalInfo.transFat && nutritionalInfo.transFat > 0.2) {
      return false; // Trans fat limit
    }
    
    return true;
  }

  private validateSingleClaim(
    claim: string, 
    nutritionalInfo: NutritionalInfo, 
    dailyValues: DailyValues
  ): { valid: boolean; reason?: string } {
    const lowerClaim = claim.toLowerCase();

    // Zero/Free claims
    if (lowerClaim.includes('zero açúcar') || lowerClaim.includes('sem açúcar')) {
      return {
        valid: !nutritionalInfo.sugars || nutritionalInfo.sugars < 0.5,
        reason: 'Produto deve conter menos de 0.5g de açúcar por 100g'
      };
    }

    if (lowerClaim.includes('zero gordura') || lowerClaim.includes('sem gordura')) {
      return {
        valid: !nutritionalInfo.fat || nutritionalInfo.fat < 0.5,
        reason: 'Produto deve conter menos de 0.5g de gordura por 100g'
      };
    }

    if (lowerClaim.includes('zero sódio') || lowerClaim.includes('sem sódio')) {
      return {
        valid: !nutritionalInfo.sodium || nutritionalInfo.sodium < 5,
        reason: 'Produto deve conter menos de 5mg de sódio por 100g'
      };
    }

    // Low/Reduced claims
    if (lowerClaim.includes('baixo') || lowerClaim.includes('reduzido')) {
      if (lowerClaim.includes('sódio')) {
        return {
          valid: nutritionalInfo.sodium ? nutritionalInfo.sodium < 120 : true,
          reason: 'Produto com baixo sódio deve conter menos de 120mg por 100g'
        };
      }
      
      if (lowerClaim.includes('açúcar')) {
        return {
          valid: nutritionalInfo.sugars ? nutritionalInfo.sugars < 5 : true,
          reason: 'Produto com baixo açúcar deve conter menos de 5g por 100g'
        };
      }

      if (lowerClaim.includes('gordura')) {
        return {
          valid: nutritionalInfo.fat ? nutritionalInfo.fat < 3 : true,
          reason: 'Produto com baixa gordura deve conter menos de 3g por 100g'
        };
      }
    }

    // High/Source claims
    if (lowerClaim.includes('fonte de') || lowerClaim.includes('rico em')) {
      if (lowerClaim.includes('fibra')) {
        return {
          valid: nutritionalInfo.fiber ? nutritionalInfo.fiber >= 3 : false,
          reason: 'Fonte de fibra deve conter pelo menos 3g por 100g'
        };
      }

      if (lowerClaim.includes('proteína')) {
        const proteinPercent = nutritionalInfo.protein 
          ? (nutritionalInfo.protein / dailyValues.protein.value) * 100 
          : 0;
        return {
          valid: proteinPercent >= 10,
          reason: 'Fonte de proteína deve fornecer pelo menos 10% da IDR'
        };
      }

      if (lowerClaim.includes('vitamina')) {
        // Would need specific vitamin mentioned to validate properly
        return {
          valid: false,
          reason: 'Claim de vitamina precisa especificar qual vitamina'
        };
      }
    }

    // Default - claim not recognized
    return {
      valid: false,
      reason: 'Claim não reconhecido ou não pode ser validado automaticamente'
    };
  }

  private getClaimRecommendations(results: any[]): string[] {
    const recommendations: string[] = [];
    const invalidClaims = results.filter(r => !r.valid);

    if (invalidClaims.length > 0) {
      recommendations.push(`Revisar ${invalidClaims.length} claim(s) que não atendem aos critérios`);
      
      invalidClaims.forEach(claim => {
        if (claim.reason) {
          recommendations.push(`${claim.claim}: ${claim.reason}`);
        }
      });
    }

    if (results.every(r => r.valid)) {
      recommendations.push('Todos os claims nutricionais estão em conformidade');
    }

    return recommendations;
  }

  private calculateAverageNutrients(
    nutritionalInfos: NutritionalInfo[]
  ): NutritionalInfo {
    const avg: NutritionalInfo = {};
    const count = nutritionalInfos.length;

    const nutrients: (keyof NutritionalInfo)[] = [
      'energy', 'protein', 'carbohydrates', 'sugars', 'fat',
      'saturatedFat', 'transFat', 'fiber', 'sodium'
    ];

    nutrients.forEach(nutrient => {
      const sum = nutritionalInfos.reduce((acc, info) => {
        return acc + (info[nutrient] || 0);
      }, 0);
      avg[nutrient] = Math.round((sum / count) * 10) / 10;
    });

    return avg;
  }

  private generateComparisonInsights(scores: any[]): string[] {
    const insights: string[] = [];
    
    // Score spread
    const scoreSpread = scores[0].score.overall - scores[scores.length - 1].score.overall;
    if (scoreSpread > 30) {
      insights.push('Grande variação na qualidade nutricional entre os produtos');
    } else {
      insights.push('Produtos têm perfil nutricional similar');
    }

    // Common strengths
    const allStrengths = scores.flatMap(s => s.score.strengths);
    const strengthCounts = allStrengths.reduce((acc, strength) => {
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(strengthCounts).forEach(([strength, count]) => {
      if (count >= scores.length / 2) {
        insights.push(`Maioria dos produtos: ${strength}`);
      }
    });

    // Common warnings
    const allWarnings = scores.flatMap(s => s.score.warnings);
    const warningCounts = allWarnings.reduce((acc, warning) => {
      acc[warning] = (acc[warning] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(warningCounts).forEach(([warning, count]) => {
      if (count >= scores.length / 2) {
        insights.push(`Atenção comum: ${warning}`);
      }
    });

    return insights;
  }
}

export const nutritionService = new NutritionService();