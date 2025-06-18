import { PrismaClient } from '@prisma/client';
import { Product } from '../../../domain/entities/Product';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductCategory } from '../../../domain/enums/ProductCategory';
import { ProductStatus } from '../../../domain/enums/ProductStatus';
export declare class PrismaProductRepository implements IProductRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<Product | null>;
    findByEAN(ean: string): Promise<Product | null>;
    save(product: Product): Promise<void>;
    delete(id: string): Promise<void>;
    findMany(criteria: {
        brandId?: string;
        status?: ProductStatus;
        category?: ProductCategory;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<Product[]>;
    countByBrand(brandId: string): Promise<number>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=PrismaProductRepository.d.ts.map