// Nutrition types for True Label platform

// Basic nutrition information per serving/100g
export interface NutritionFacts {
  servingSize: number;
  servingUnit: string;
  servingsPerContainer?: number;
  // Per serving values
  calories: number;
  caloriesFromFat?: number;
  // Macronutrients (in grams)
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat?: number;
  monounsaturatedFat?: number;
  cholesterol: number; // in mg
  sodium: number; // in mg
  totalCarbohydrates: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars?: number;
  sugarAlcohol?: number;
  protein: number;
  // Vitamins and minerals (with units)
  vitamins?: VitaminMineral[];
  minerals?: VitaminMineral[];
  // Additional nutrients
  omega3?: number; // in mg
  omega6?: number; // in mg
  caffeine?: number; // in mg
}

export interface VitaminMineral {
  name: string;
  amount: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  dailyValue?: number; // percentage
}

// Nutrition scoring systems
export interface NutritionScores {
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  nutriScoreDetails?: {
    positivePoints: number;
    negativePoints: number;
    totalScore: number;
  };
  healthStarRating?: number; // 0.5 to 5 stars
  guidelinesDailyAmount?: {
    calories: number;
    sugars: number;
    fat: number;
    saturates: number;
    salt: number;
  };
}

// Health claims and regulations
export interface HealthClaim {
  id?: string;
  claim: string;
  type: 'NUTRIENT_CONTENT' | 'HEALTH' | 'FUNCTION' | 'REDUCTION_RISK';
  status: 'VALID' | 'INVALID' | 'WARNING';
  regulation?: string;
  evidence?: string;
  warnings?: string[];
}

// Compliance with regulations
export interface ComplianceStatus {
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  regulations: RegulationCompliance[];
  warnings: ComplianceWarning[];
  suggestions: string[];
}

export interface RegulationCompliance {
  regulation: 'ANVISA' | 'FDA' | 'EU' | 'MERCOSUL';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  details: string;
  lastChecked: string;
}

export interface ComplianceWarning {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  regulation?: string;
}

// Nutrition comparison
export interface NutritionComparison {
  productId: string;
  productName: string;
  nutritionFacts: NutritionFacts;
  scores?: NutritionScores;
  categoryAverage?: NutritionFacts;
  percentageDifference?: {
    [key: string]: number; // percentage difference from category average
  };
}

// Nutrition analysis report
export interface NutritionReport {
  id: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  nutritionFacts: NutritionFacts;
  scores: NutritionScores;
  healthClaims: HealthClaim[];
  compliance: ComplianceStatus;
  recommendations: string[];
  certifiedBy?: {
    name: string;
    credentials: string;
    registrationNumber: string;
  };
}

// Form data for nutrition input
export interface NutritionFormData {
  nutritionFacts: Partial<NutritionFacts>;
  healthClaims: string[];
  targetMarket: 'BRAZIL' | 'USA' | 'EU' | 'MERCOSUL';
}

// Category nutrition averages
export interface CategoryNutritionData {
  category: string;
  sampleSize: number;
  averageNutrition: NutritionFacts;
  lastUpdated: string;
}

// Validation rules for nutrition data
export interface NutritionValidationRules {
  minServingSize: number;
  maxServingSize: number;
  allowedServingUnits: string[];
  requiredFields: string[];
  maxCaloriesPerServing?: number;
  maxSodiumPerServing?: number;
  maxSugarPerServing?: number;
  maxSaturatedFatPerServing?: number;
}

// Nutrition calculation utilities
export interface NutritionCalculation {
  per100g: NutritionFacts;
  perServing: NutritionFacts;
  dailyValues: {
    [nutrient: string]: number; // percentage
  };
}

// Allergen information
export interface AllergenInfo {
  contains: string[];
  mayContain: string[];
  freeFrom: string[];
  certifiedAllergenFree?: boolean;
}

// Special dietary information
export interface DietaryInfo {
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  isKosher: boolean;
  isHalal: boolean;
  isOrganic: boolean;
  certifications?: string[];
}