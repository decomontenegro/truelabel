import { ValueObject } from '../base/ValueObject';
interface ClaimProps {
    value: string;
}
export declare class Claim extends ValueObject<ClaimProps> {
    private static readonly MIN_LENGTH;
    private static readonly MAX_LENGTH;
    private static readonly RESTRICTED_TERMS;
    private constructor();
    static create(claim: string): Claim;
    get value(): string;
    private static validateClaimContent;
    private static sanitize;
    getCategory(): ClaimCategory;
    private isNutritionalClaim;
    private isHealthClaim;
    private isQualityClaim;
    private isSustainabilityClaim;
    requiresEvidence(): boolean;
    toString(): string;
}
export declare enum ClaimCategory {
    NUTRITIONAL = "NUTRITIONAL",
    HEALTH = "HEALTH",
    QUALITY = "QUALITY",
    SUSTAINABILITY = "SUSTAINABILITY",
    GENERAL = "GENERAL"
}
export {};
//# sourceMappingURL=Claim.d.ts.map