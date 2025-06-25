import { Product } from '../../../domain/entities/Product';
import { ProductCategory } from '../../../domain/enums/ProductCategory';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IBrandRepository } from '../../../domain/repositories/IBrandRepository';
import { IUseCase } from '../../interfaces/IUseCase';
import { CreateProductDTO } from '../../dtos/product/CreateProductDTO';
import { ProductDTO } from '../../dtos/product/ProductDTO';
import { ProductMapper } from '../../mappers/ProductMapper';
import { NotFoundError } from '../../errors/ApplicationErrors';
import { ConflictError } from '../../errors/ApplicationErrors';

export class CreateProductUseCase implements IUseCase<CreateProductDTO, ProductDTO> {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly brandRepository: IBrandRepository
  ) {}

  async execute(input: CreateProductDTO): Promise<ProductDTO> {
    // Validate brand exists
    const brand = await this.brandRepository.findById(input.brandId);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    // Check if product with same EAN already exists
    const existingProduct = await this.productRepository.findByEAN(input.ean);
    if (existingProduct) {
      throw new ConflictError(`Product with EAN ${input.ean} already exists`);
    }

    // Create domain entity
    const product = Product.create({
      name: input.name,
      description: input.description,
      ean: input.ean,
      category: input.category as ProductCategory,
      brandId: input.brandId,
      claims: input.claims,
      ingredients: input.ingredients,
      nutritionalInfo: input.nutritionalInfo,
      images: input.images,
    });

    // Validate business rules
    if (!product.hasRequiredInfoForValidation() && input.requestValidation) {
      throw new Error(
        'Product must have claims and ingredients to request validation'
      );
    }

    // Save to repository
    await this.productRepository.save(product);

    // Return DTO
    return ProductMapper.toDTO(product);
  }
}