export interface CreateProductDTO {
  name: string;
  description?: string;
  ean: string;
  category: string;
  brandId: string;
  claims?: string[];
  ingredients?: string[];
  nutritionalInfo?: Record<string, any>;
  images?: string[];
  requestValidation?: boolean;
}