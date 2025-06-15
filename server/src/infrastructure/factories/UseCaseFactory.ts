import { PrismaClient } from '@prisma/client';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { PrismaProductRepository } from '../database/repositories/PrismaProductRepository';
import { PrismaBrandRepository } from '../database/repositories/PrismaBrandRepository';
import { getPrismaClient } from '../../lib/prisma';

export class UseCaseFactory {
  private static prisma: PrismaClient;
  private static productRepository: PrismaProductRepository;
  private static brandRepository: PrismaBrandRepository;

  private static getPrisma(): PrismaClient {
    if (!this.prisma) {
      this.prisma = getPrismaClient();
    }
    return this.prisma;
  }

  private static getProductRepository(): PrismaProductRepository {
    if (!this.productRepository) {
      this.productRepository = new PrismaProductRepository(this.getPrisma());
    }
    return this.productRepository;
  }

  private static getBrandRepository(): PrismaBrandRepository {
    if (!this.brandRepository) {
      this.brandRepository = new PrismaBrandRepository(this.getPrisma());
    }
    return this.brandRepository;
  }

  static createProductUseCase(): CreateProductUseCase {
    return new CreateProductUseCase(
      this.getProductRepository(),
      this.getBrandRepository()
    );
  }

  // Add more use case factory methods as needed
}