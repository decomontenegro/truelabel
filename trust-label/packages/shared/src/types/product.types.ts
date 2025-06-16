export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum ClaimType {
  NUTRITIONAL = 'NUTRITIONAL',
  HEALTH = 'HEALTH',
  CERTIFICATION = 'CERTIFICATION',
  ALLERGEN = 'ALLERGEN',
  HEAVY_METAL = 'HEAVY_METAL',
  MICROBIOLOGICAL = 'MICROBIOLOGICAL',
  BANNED_SUBSTANCE = 'BANNED_SUBSTANCE',
  OTHER = 'OTHER',
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  barcode: string;
  sku: string;
  category: string;
  images: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Claim {
  id: string;
  productId: string;
  type: ClaimType;
  category: string;
  value: string;
  unit?: string;
  description?: string;
  createdAt: Date;
}

export interface Brand {
  id: string;
  userId: string;
  name: string;
  cnpj: string;
  logo?: string;
  website?: string;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  barcode: string;
  sku: string;
  category: string;
  images?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: ProductStatus;
}

export interface CreateClaimRequest {
  type: ClaimType;
  category: string;
  value: string;
  unit?: string;
  description?: string;
}