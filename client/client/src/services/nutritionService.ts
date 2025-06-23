import { api } from '@/lib/api';

export interface NutritionalInfo {
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

export interface DailyValues {
  [nutrient: string]: {
    value: number;
    unit: string;
  };
}

export interface NutritionalScore {
  overall: number;
  breakdown: {
    positive: number;
    negative: number;
  };
  grade: string;
  strengths: string[];
  warnings: string[];
}

export interface NutritionalAnalysis {
  score: NutritionalScore;
  targetAudienceAnalysis: {
    suitable: boolean;
    highlights: string[];
    concerns: string[];
    recommendations: string[];
  };
  complianceStatus: {
    brazil: boolean;
    general: boolean;
  };
}

export interface ClaimValidationResult {
  overallValid: boolean;
  validationRate: number;
  results: Array<{
    claim: string;
    valid: boolean;
    reason?: string;
  }>;
  recommendations: string[];
}

export interface ProductComparison {
  ranking: Array<{
    rank: number;
    productId: string;
    score: number;
    grade: string;
  }>;
  comparison: {
    best: any;
    worst: any;
    averages: NutritionalInfo;
  };
  insights: string[];
}

class NutritionService {
  /**
   * Get daily nutritional values by country
   */
  async getDailyValues(country: string): Promise<DailyValues> {
    const response = await api.get(`/nutrition/daily-values/${country}`);
    return response.data.data;
  }

  /**
   * Calculate nutritional score for a product
   */
  async calculateScore(params: {
    nutritionalInfo: NutritionalInfo;
    servingSize?: number;
    country?: string;
  }): Promise<NutritionalScore> {
    const response = await api.post('/nutrition/calculate-score', params);
    return response.data.data;
  }

  /**
   * Analyze nutritional information
   */
  async analyzeNutrition(params: {
    nutritionalInfo: NutritionalInfo;
    category?: string;
    targetAudience?: 'general' | 'children' | 'elderly' | 'athletes';
  }): Promise<NutritionalAnalysis> {
    const response = await api.post('/nutrition/analyze', params);
    return response.data.data;
  }

  /**
   * Validate nutritional claims
   */
  async validateClaims(params: {
    nutritionalInfo: NutritionalInfo;
    claims: string[];
    country?: string;
  }): Promise<ClaimValidationResult> {
    const response = await api.post('/nutrition/validate-claims', params);
    return response.data.data;
  }

  /**
   * Compare multiple products
   */
  async compareProducts(
    products: Array<{ id: string; nutritionalInfo: NutritionalInfo }>
  ): Promise<ProductComparison> {
    const response = await api.post('/nutrition/compare', { products });
    return response.data.data;
  }

  /**
   * Format nutritional value with unit
   */
  formatNutritionalValue(value: number | undefined, unit: string): string {
    if (value === undefined || value === null) return '-';
    
    if (unit === 'mg' || unit === 'mcg') {
      return `${value}${unit}`;
    }
    
    return `${value}${unit}`;
  }

  /**
   * Get nutritional grade color
   */
  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'E': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Get score color based on value
   */
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 35) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Validate nutritional info completeness
   */
  validateCompleteness(nutritionalInfo: NutritionalInfo): {
    isComplete: boolean;
    missingFields: string[];
    completenessPercentage: number;
  } {
    const requiredFields: (keyof NutritionalInfo)[] = [
      'energy', 'protein', 'carbohydrates', 'fat', 'fiber', 'sodium'
    ];
    
    const missingFields = requiredFields.filter(field => 
      nutritionalInfo[field] === undefined || nutritionalInfo[field] === null
    );

    const totalFields = Object.keys(nutritionalInfo).length;
    const expectedFields = 15; // Total possible fields
    const completenessPercentage = Math.round((totalFields / expectedFields) * 100);

    return {
      isComplete: missingFields.length === 0,
      missingFields: missingFields as string[],
      completenessPercentage
    };
  }
}

export const nutritionService = new NutritionService();