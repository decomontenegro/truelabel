import { Brand } from '../entities/Brand';

export interface BrandSearchCriteria {
  name?: string;
  email?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface IBrandRepository {
  // Basic operations
  findById(id: string): Promise<Brand | null>;
  findByEmail(email: string): Promise<Brand | null>;
  findByUserId(userId: string): Promise<Brand | null>;
  save(brand: Brand): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Search operations
  findMany(criteria: BrandSearchCriteria): Promise<Brand[]>;
  findAll(): Promise<Brand[]>;
  
  // Verification
  findVerifiedBrands(): Promise<Brand[]>;
  findPendingVerification(): Promise<Brand[]>;
  
  // Statistics
  count(): Promise<number>;
  countActive(): Promise<number>;
  
  // Batch operations
  findByIds(ids: string[]): Promise<Brand[]>;
}