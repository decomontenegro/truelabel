import { ValueObject } from '../base/ValueObject';
interface EANProps {
    value: string;
}
export declare class EAN extends ValueObject<EANProps> {
    private constructor();
    static create(ean: string): EAN;
    get value(): string;
    private static isValidEAN;
    private static validateCheckDigit;
    format(): string;
    getCountryCode(): string;
    toString(): string;
}
export declare const BRAZILIAN_EAN_PREFIXES: string[];
export {};
//# sourceMappingURL=EAN.d.ts.map