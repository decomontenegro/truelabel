import { ValueObject } from '../base/ValueObject';
interface ProductNameProps {
    value: string;
}
export declare class ProductName extends ValueObject<ProductNameProps> {
    private static readonly MIN_LENGTH;
    private static readonly MAX_LENGTH;
    private constructor();
    static create(name: string): ProductName;
    get value(): string;
    private static containsProhibitedCharacters;
    private static sanitize;
    getSlug(): string;
    getInitials(): string;
    toString(): string;
}
export {};
//# sourceMappingURL=ProductName.d.ts.map