import { Entity } from '../base/Entity';
import { ProductStatus } from '../enums/ProductStatus';
import { ProductCategory } from '../enums/ProductCategory';
import { EAN } from '../value-objects/EAN';
import { ProductName } from '../value-objects/ProductName';
import { Claim } from '../value-objects/Claim';
export interface ProductProps {
    name: ProductName;
    description?: string;
    ean: EAN;
    category: ProductCategory;
    status: ProductStatus;
    brandId: string;
    claims: Claim[];
    ingredients: string[];
    nutritionalInfo?: Record<string, any>;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class Product extends Entity<ProductProps> {
    private constructor();
    static create(props: {
        name: string;
        description?: string;
        ean: string;
        category: ProductCategory;
        brandId: string;
        claims?: string[];
        ingredients?: string[];
        nutritionalInfo?: Record<string, any>;
        images?: string[];
    }, id?: string): Product;
    static reconstitute(props: ProductProps, id: string): Product;
    get name(): string;
    get description(): string | undefined;
    get ean(): string;
    get category(): ProductCategory;
    get status(): ProductStatus;
    get brandId(): string;
    get claims(): string[];
    get ingredients(): string[];
    get nutritionalInfo(): Record<string, any> | undefined;
    get images(): string[];
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateDescription(description: string): void;
    addClaim(claim: string): void;
    removeClaim(claim: string): void;
    updateIngredients(ingredients: string[]): void;
    updateNutritionalInfo(info: Record<string, any>): void;
    addImage(imageUrl: string): void;
    removeImage(imageUrl: string): void;
    canBeValidated(): boolean;
    markAsInValidation(): void;
    markAsValidated(): void;
    markAsValidatedWithRemarks(remarks: string[]): void;
    markAsRejected(reason: string): void;
    suspend(reason: string): void;
    reactivate(): void;
    isValidated(): boolean;
    isActive(): boolean;
    canBeDeleted(): boolean;
    hasRequiredInfoForValidation(): boolean;
    private markAsUpdated;
    toJSON(): Record<string, any>;
}
//# sourceMappingURL=Product.d.ts.map