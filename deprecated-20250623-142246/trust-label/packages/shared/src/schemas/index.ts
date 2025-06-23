import { z } from 'zod';
import { UserRole, ProductStatus, ClaimType, ValidationStatus, ClaimValidationStatus } from '../types';
import { VALIDATION_RULES } from '../constants';
import { isValidEmail, isValidPassword, isValidBarcode, isValidCNPJ } from '../utils';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().refine(isValidEmail, 'Invalid email format'),
  password: z.string().refine(isValidPassword, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole).optional(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  barcode: z.string().refine(isValidBarcode, 'Invalid barcode format'),
  sku: z.string().max(VALIDATION_RULES.SKU_MAX_LENGTH, `SKU must be at most ${VALIDATION_RULES.SKU_MAX_LENGTH} characters`),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url()).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Claim schemas
export const createClaimSchema = z.object({
  type: z.nativeEnum(ClaimType),
  category: z.string().min(1, 'Category is required'),
  value: z.string().max(VALIDATION_RULES.CLAIM_VALUE_MAX_LENGTH),
  unit: z.string().optional(),
  description: z.string().optional(),
});

// Validation schemas
export const createValidationSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
  reportNumber: z.string().min(1, 'Report number is required'),
  reportUrl: z.string().url('Invalid report URL'),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export const updateValidationSchema = createValidationSchema.partial().extend({
  status: z.nativeEnum(ValidationStatus).optional(),
  aiAnalysis: z.record(z.any()).optional(),
});

export const updateClaimStatusSchema = z.object({
  status: z.nativeEnum(ClaimValidationStatus),
  actualValue: z.string().optional(),
  remarks: z.string().optional(),
  confidence: z.number().min(VALIDATION_RULES.CONFIDENCE_MIN).max(VALIDATION_RULES.CONFIDENCE_MAX),
  methodology: z.string().optional(),
});

// Brand schemas
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  cnpj: z.string().refine(isValidCNPJ, 'Invalid CNPJ'),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
});

// Laboratory schemas
export const createLaboratorySchema = z.object({
  name: z.string().min(1, 'Laboratory name is required'),
  cnpj: z.string().refine(isValidCNPJ, 'Invalid CNPJ'),
  accreditation: z.array(z.string()),
  certifications: z.array(z.string()),
  specialties: z.array(z.string()),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().min(1),
});

// Type exports for use in frontend/backend
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type CreateValidationInput = z.infer<typeof createValidationSchema>;
export type UpdateValidationInput = z.infer<typeof updateValidationSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateLaboratoryInput = z.infer<typeof createLaboratorySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;