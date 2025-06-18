import { Brand } from '../entities/Brand';
export interface BrandSearchCriteria {
    name?: string;
    email?: string;
    isActive?: boolean;
    isVerified?: boolean;
}
export interface IBrandRepository {
    findById(id: string): Promise<Brand | null>;
    findByEmail(email: string): Promise<Brand | null>;
    findByUserId(userId: string): Promise<Brand | null>;
    save(brand: Brand): Promise<void>;
    delete(id: string): Promise<void>;
    findMany(criteria: BrandSearchCriteria): Promise<Brand[]>;
    findAll(): Promise<Brand[]>;
    findVerifiedBrands(): Promise<Brand[]>;
    findPendingVerification(): Promise<Brand[]>;
    count(): Promise<number>;
    countActive(): Promise<number>;
    findByIds(ids: string[]): Promise<Brand[]>;
}
//# sourceMappingURL=IBrandRepository.d.ts.map