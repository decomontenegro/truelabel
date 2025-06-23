import { Product } from '../entities/Product';
import { ProductStatus } from '../enums/ProductStatus';
import { ProductCategory } from '../enums/ProductCategory';

export interface ProductSearchCriteria {
  brandId?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  name?: string;
  ean?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IProductRepository {
  // Basic operations
  findById(id: string): Promise<Product | null>;
  findByEAN(ean: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Search operations
  findMany(criteria: ProductSearchCriteria): Promise<Product[]>;
  findManyPaginated(
    criteria: ProductSearchCriteria, 
    options: PaginationOptions
  ): Promise<PaginatedResult<Product>>;
  
  // Specific queries
  findByBrandId(brandId: string): Promise<Product[]>;
  findValidatedProducts(limit?: number): Promise<Product[]>;
  findPendingValidation(laboratoryId?: string): Promise<Product[]>;
  
  // Statistics
  countByStatus(brandId?: string): Promise<Record<ProductStatus, number>>;
  countByCategory(brandId?: string): Promise<Record<ProductCategory, number>>;
  
  // Batch operations
  findByIds(ids: string[]): Promise<Product[]>;
  saveMany(products: Product[]): Promise<void>;
}