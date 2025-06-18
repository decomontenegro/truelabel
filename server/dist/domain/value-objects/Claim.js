"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimCategory = exports.Claim = void 0;
const ValueObject_1 = require("../base/ValueObject");
const DomainError_1 = require("../errors/DomainError");
class Claim extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(claim) {
        if (!claim || claim.trim().length === 0) {
            throw new DomainError_1.DomainError('Claim cannot be empty');
        }
        const trimmedClaim = claim.trim();
        if (trimmedClaim.length < this.MIN_LENGTH) {
            throw new DomainError_1.DomainError(`Claim must have at least ${this.MIN_LENGTH} characters`);
        }
        if (trimmedClaim.length > this.MAX_LENGTH) {
            throw new DomainError_1.DomainError(`Claim cannot exceed ${this.MAX_LENGTH} characters`);
        }
        this.validateClaimContent(trimmedClaim);
        return new Claim({ value: this.sanitize(trimmedClaim) });
    }
    get value() {
        return this.props.value;
    }
    static validateClaimContent(claim) {
        const lowerClaim = claim.toLowerCase();
        const foundRestrictedTerms = this.RESTRICTED_TERMS.filter(term => lowerClaim.includes(term.toLowerCase()));
        if (foundRestrictedTerms.length > 0) {
            throw new DomainError_1.DomainError(`Claim contains restricted terms: ${foundRestrictedTerms.join(', ')}. ` +
                `These terms may require additional validation or documentation.`);
        }
        const specialCharCount = (claim.match(/[!@#$%^&*()]/g) || []).length;
        if (specialCharCount > claim.length * 0.1) {
            throw new DomainError_1.DomainError('Claim contains too many special characters');
        }
        const upperCaseRatio = (claim.match(/[A-Z]/g) || []).length / claim.length;
        if (upperCaseRatio > 0.8 && claim.length > 10) {
            throw new DomainError_1.DomainError('Claim should not be in all capital letters');
        }
    }
    static sanitize(claim) {
        return claim
            .replace(/\s+/g, ' ')
            .trim();
    }
    getCategory() {
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
    isNutritionalClaim(claim) {
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
    isHealthClaim(claim) {
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
    isQualityClaim(claim) {
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
    isSustainabilityClaim(claim) {
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
    requiresEvidence() {
        const category = this.getCategory();
        return category === ClaimCategory.NUTRITIONAL ||
            category === ClaimCategory.HEALTH;
    }
    toString() {
        return this.props.value;
    }
}
exports.Claim = Claim;
Claim.MIN_LENGTH = 5;
Claim.MAX_LENGTH = 500;
Claim.RESTRICTED_TERMS = [
    'cura', 'cure',
    'milagre', 'miracle',
    'garantido', 'guaranteed',
    '100%',
    'imediato', 'immediate',
    'instantâneo', 'instant',
    'sem efeitos colaterais', 'no side effects',
];
var ClaimCategory;
(function (ClaimCategory) {
    ClaimCategory["NUTRITIONAL"] = "NUTRITIONAL";
    ClaimCategory["HEALTH"] = "HEALTH";
    ClaimCategory["QUALITY"] = "QUALITY";
    ClaimCategory["SUSTAINABILITY"] = "SUSTAINABILITY";
    ClaimCategory["GENERAL"] = "GENERAL";
})(ClaimCategory || (exports.ClaimCategory = ClaimCategory = {}));
//# sourceMappingURL=Claim.js.map