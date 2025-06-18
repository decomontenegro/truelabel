"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProductUseCase = void 0;
const Product_1 = require("../../../domain/entities/Product");
const ProductMapper_1 = require("../../mappers/ProductMapper");
const ApplicationErrors_1 = require("../../errors/ApplicationErrors");
const ApplicationErrors_2 = require("../../errors/ApplicationErrors");
class CreateProductUseCase {
    constructor(productRepository, brandRepository) {
        this.productRepository = productRepository;
        this.brandRepository = brandRepository;
    }
    async execute(input) {
        const brand = await this.brandRepository.findById(input.brandId);
        if (!brand) {
            throw new ApplicationErrors_1.NotFoundError('Brand not found');
        }
        const existingProduct = await this.productRepository.findByEAN(input.ean);
        if (existingProduct) {
            throw new ApplicationErrors_2.ConflictError(`Product with EAN ${input.ean} already exists`);
        }
        const product = Product_1.Product.create({
            name: input.name,
            description: input.description,
            ean: input.ean,
            category: input.category,
            brandId: input.brandId,
            claims: input.claims,
            ingredients: input.ingredients,
            nutritionalInfo: input.nutritionalInfo,
            images: input.images,
        });
        if (!product.hasRequiredInfoForValidation() && input.requestValidation) {
            throw new Error('Product must have claims and ingredients to request validation');
        }
        await this.productRepository.save(product);
        return ProductMapper_1.ProductMapper.toDTO(product);
    }
}
exports.CreateProductUseCase = CreateProductUseCase;
//# sourceMappingURL=CreateProductUseCase.js.map