import { PrismaClient } from '@prisma/client';
import { Product } from '../../../domain/entities/Product';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ProductCategory } from '../../../domain/enums/ProductCategory';
import { ProductStatus } from '../../../domain/enums/ProductStatus';
import { EAN } from '../../../domain/value-objects/EAN';
import { ProductName } from '../../../domain/value-objects/ProductName';
import { Claim } from '../../../domain/value-objects/Claim';
import { productQueries } from '../../../utils/database/prisma-optimizations';

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const data = await this.prisma.product.findUnique(
      productQueries.findWithFullDetails(id)
    );

    if (!data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByEAN(ean: string): Promise<Product | null> {
    const data = await this.prisma.product.findFirst({
      where: { ean }
    });

    if (!data) {
      return null;
    }

    return this.toDomain(data);
  }

  async save(product: Product): Promise<void> {
    const data = this.toPersistence(product);

    await this.prisma.product.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id }
    });
  }

  async findMany(criteria: {
    brandId?: string;
    status?: ProductStatus;
    category?: ProductCategory;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const where: any = {};

    if (criteria.brandId) {
      where.brandId = criteria.brandId;
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.category) {
      where.category = criteria.category;
    }

    if (criteria.search) {
      where.OR = [
        { name: { contains: criteria.search, mode: 'insensitive' } },
        { description: { contains: criteria.search, mode: 'insensitive' } },
        { ean: { contains: criteria.search } }
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      take: criteria.limit || 10,
      skip: criteria.offset || 0,
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(products.map(p => this.toDomain(p)));
  }

  async countByBrand(brandId: string): Promise<number> {
    return this.prisma.product.count({
      where: { brandId }
    });
  }

  private toDomain(raw: any): Product {
    const name = ProductName.create(raw.name);
    const ean = EAN.create(raw.ean);
    const claims = (raw.claims || []).map((c: string) => Claim.create(c));

    return Product.reconstitute(
      {
        name,
        description: raw.description,
        ean,
        category: raw.category as ProductCategory,
        status: raw.status as ProductStatus,
        brandId: raw.brandId,
        claims,
        ingredients: raw.ingredients || [],
        nutritionalInfo: raw.nutritionalInfo,
        images: raw.images || [],
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
      },
      raw.id
    );
  }

  private toPersistence(product: Product): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      ean: product.ean,
      category: product.category,
      status: product.status,
      brandId: product.brandId,
      claims: product.claims,
      ingredients: product.ingredients,
      nutritionalInfo: product.nutritionalInfo,
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
}