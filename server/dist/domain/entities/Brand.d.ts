import { Entity } from '../base/Entity';
import { Email } from '../value-objects/Email';
import { BrandName } from '../value-objects/BrandName';
import { CNPJ } from '../value-objects/CNPJ';
import { Website } from '../value-objects/Website';
export interface BrandProps {
    name: BrandName;
    email: Email;
    cnpj?: CNPJ;
    description?: string;
    logo?: string;
    website?: Website;
    address?: BrandAddress;
    isActive: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BrandAddress {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
}
export declare class Brand extends Entity<BrandProps> {
    private constructor();
    static create(props: {
        name: string;
        email: string;
        cnpj?: string;
        description?: string;
        logo?: string;
        website?: string;
        address?: BrandAddress;
        userId?: string;
    }, id?: string): Brand;
    static reconstitute(props: BrandProps, id: string): Brand;
    get name(): string;
    get email(): string;
    get cnpj(): string | undefined;
    get description(): string | undefined;
    get logo(): string | undefined;
    get website(): string | undefined;
    get address(): BrandAddress | undefined;
    get isActive(): boolean;
    get isVerified(): boolean;
    get verifiedAt(): Date | undefined;
    get userId(): string | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateEmail(email: string): void;
    updateCNPJ(cnpj: string): void;
    updateDescription(description: string): void;
    updateLogo(logoUrl: string): void;
    updateWebsite(website: string): void;
    updateAddress(address: BrandAddress): void;
    verify(): void;
    unverify(reason: string): void;
    activate(): void;
    deactivate(reason: string): void;
    canBeVerified(): boolean;
    canCreateProducts(): boolean;
    hasCompleteProfile(): boolean;
    private validateAddress;
    private markAsUpdated;
    toJSON(): Record<string, any>;
}
//# sourceMappingURL=Brand.d.ts.map