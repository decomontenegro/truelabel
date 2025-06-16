import { ValueObject } from '../base/ValueObject';
import { DomainError } from '../errors/DomainError';

interface ClaimProps {
  value: string;
}

export class Claim extends ValueObject<ClaimProps> {
  private static readonly MIN_LENGTH = 5;
  private static readonly MAX_LENGTH = 500;
  
  // Common misleading terms that require validation
  private static readonly RESTRICTED_TERMS = [
    'cura', 'cure',
    'milagre', 'miracle',
    'garantido', 'guaranteed',
    '100%',
    'imediato', 'immediate',
    'instantâneo', 'instant',
    'sem efeitos colaterais', 'no side effects',
  ];

  private constructor(props: ClaimProps) {
    super(props);
  }

  static create(claim: string): Claim {
    if (!claim || claim.trim().length === 0) {
      throw new DomainError('Claim cannot be empty');
    }

    const trimmedClaim = claim.trim();

    if (trimmedClaim.length < this.MIN_LENGTH) {
      throw new DomainError(
        `Claim must have at least ${this.MIN_LENGTH} characters`
      );
    }

    if (trimmedClaim.length > this.MAX_LENGTH) {
      throw new DomainError(
        `Claim cannot exceed ${this.MAX_LENGTH} characters`
      );
    }

    this.validateClaimContent(trimmedClaim);

    return new Claim({ value: this.sanitize(trimmedClaim) });
  }

  get value(): string {
    return this.props.value;
  }

  private static validateClaimContent(claim: string): void {
    const lowerClaim = claim.toLowerCase();

    // Check for restricted terms
    const foundRestrictedTerms = this.RESTRICTED_TERMS.filter(term => 
      lowerClaim.includes(term.toLowerCase())
    );

    if (foundRestrictedTerms.length > 0) {
      throw new DomainError(
        `Claim contains restricted terms: ${foundRestrictedTerms.join(', ')}. ` +
        `These terms may require additional validation or documentation.`
      );
    }

    // Check for excessive use of special characters (possible spam)
    const specialCharCount = (claim.match(/[!@#$%^&*()]/g) || []).length;
    if (specialCharCount > claim.length * 0.1) {
      throw new DomainError('Claim contains too many special characters');
    }

    // Check for all caps (considered shouting)
    const upperCaseRatio = (claim.match(/[A-Z]/g) || []).length / claim.length;
    if (upperCaseRatio > 0.8 && claim.length > 10) {
      throw new DomainError('Claim should not be in all capital letters');
    }
  }

  private static sanitize(claim: string): string {
    return claim
      .replace(/\s+/g, ' ')
      .trim();
  }

  getCategory(): ClaimCategory {
    const lowerValue = this.props.value.toLowerCase();

    if (this.isNutritionalClaim(lowerValue)) {
      return ClaimCategory.NUTRITIONAL;
    }
    
    if (this.isHealthClaim(lowerValue)) {
      return ClaimCategory.HEALTH;
    }
    
    if (this.isQualityClaim(lowerValue)) {
      return ClaimCategory.QUALITY;
    }
    
    if (this.isSustainabilityClaim(lowerValue)) {
      return ClaimCategory.SUSTAINABILITY;
    }

    return ClaimCategory.GENERAL;
  }

  private isNutritionalClaim(claim: string): boolean {
    const nutritionalKeywords = [
      'proteína', 'protein',
      'carboidrato', 'carbohydrate', 'carb',
      'gordura', 'fat',
      'caloria', 'calorie', 'kcal',
      'vitamina', 'vitamin',
      'mineral',
      'fibra', 'fiber',
      'açúcar', 'sugar',
      'sódio', 'sodium',
      'colesterol', 'cholesterol'
    ];

    return nutritionalKeywords.some(keyword => claim.includes(keyword));
  }

  private isHealthClaim(claim: string): boolean {
    const healthKeywords = [
      'saúde', 'health',
      'bem-estar', 'wellness',
      'imunidade', 'immunity', 'immune',
      'energia', 'energy',
      'metabolismo', 'metabolism',
      'digestão', 'digestion',
      'antioxidante', 'antioxidant',
      'probiótico', 'probiotic',
      'prebiótico', 'prebiotic'
    ];

    return healthKeywords.some(keyword => claim.includes(keyword));
  }

  private isQualityClaim(claim: string): boolean {
    const qualityKeywords = [
      'premium',
      'qualidade', 'quality',
      'puro', 'pure',
      'natural',
      'orgânico', 'organic',
      'artesanal', 'artisan',
      'gourmet',
      'superior'
    ];

    return qualityKeywords.some(keyword => claim.includes(keyword));
  }

  private isSustainabilityClaim(claim: string): boolean {
    const sustainabilityKeywords = [
      'sustentável', 'sustainable',
      'ecológico', 'ecological', 'eco',
      'reciclável', 'recyclable',
      'biodegradável', 'biodegradable',
      'vegano', 'vegan',
      'cruelty free',
      'carbono neutro', 'carbon neutral'
    ];

    return sustainabilityKeywords.some(keyword => claim.includes(keyword));
  }

  requiresEvidence(): boolean {
    const category = this.getCategory();
    return category === ClaimCategory.NUTRITIONAL || 
           category === ClaimCategory.HEALTH;
  }

  toString(): string {
    return this.props.value;
  }
}

export enum ClaimCategory {
  NUTRITIONAL = 'NUTRITIONAL',
  HEALTH = 'HEALTH',
  QUALITY = 'QUALITY',
  SUSTAINABILITY = 'SUSTAINABILITY',
  GENERAL = 'GENERAL'
}