import { Product } from '../../domain/entities/Product';
import { ProductDTO } from '../dtos/product/ProductDTO';

export class ProductMapper {
  static toDTO(product: Product, additionalData?: {
    brandName?: string;
    validations?: any[];
    qrCode?: any;
  }): ProductDTO {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      ean: product.ean,
      category: product.category,
      status: product.status,
      brandId: product.brandId,
      brandName: additionalData?.brandName,
      claims: product.claims,
      ingredients: product.ingredients,
      nutritionalInfo: product.nutritionalInfo,
      images: product.images,
      validations: additionalData?.validations?.map(v => ({
        id: v.id,
        status: v.status,
        validatedAt: v.validatedAt,
        validUntil: v.validUntil,
        laboratoryName: v.laboratory?.name
      })),
      qrCode: additionalData?.qrCode ? {
        code: additionalData.qrCode.code,
        url: additionalData.qrCode.shortUrl || additionalData.qrCode.code,
        scanCount: additionalData.qrCode.scanCount || 0
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  static toDTOList(products: Product[], additionalDataMap?: Map<string, any>): ProductDTO[] {
    return products.map(product => {
      const additionalData = additionalDataMap?.get(product.id);
      return this.toDTO(product, additionalData);
    });
  }
}