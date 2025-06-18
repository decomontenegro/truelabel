import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IBrandRepository } from '../../../domain/repositories/IBrandRepository';
import { IUseCase } from '../../interfaces/IUseCase';
import { CreateProductDTO } from '../../dtos/product/CreateProductDTO';
import { ProductDTO } from '../../dtos/product/ProductDTO';
export declare class CreateProductUseCase implements IUseCase<CreateProductDTO, ProductDTO> {
    private readonly productRepository;
    private readonly brandRepository;
    constructor(productRepository: IProductRepository, brandRepository: IBrandRepository);
    execute(input: CreateProductDTO): Promise<ProductDTO>;
}
//# sourceMappingURL=CreateProductUseCase.d.ts.map