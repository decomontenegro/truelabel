import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { PrismaProductRepository } from '../../infrastructure/database/repositories/PrismaProductRepository';
import { UseCaseFactory } from '../../infrastructure/factories/UseCaseFactory';
import { getPrismaClient } from '../../lib/prisma';
import { ApplicationError } from '../../application/errors/ApplicationErrors';
import { AuthRequest } from '../../middleware/auth';

export class ProductController {
  private createProductUseCase: CreateProductUseCase;

  constructor() {
    this.createProductUseCase = UseCaseFactory.createProductUseCase();
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const brandId = req.body.brandId || req.user!.brandId;

      if (!brandId) {
        throw new ApplicationError('Brand ID is required', 400);
      }

      const productDTO = await this.createProductUseCase.execute({
        ...req.body,
        brandId
      });

      res.status(201).json({
        status: 'success',
        data: productDTO
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, category, status } = req.query;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      // This would use a GetProductsUseCase
      // For now, using the service directly
      const { ProductService } = await import('../../services/product.service');
      
      const result = await ProductService.getProducts(
        {
          search: search as string,
          category: category as string,
          status: status as string,
          brandId: !isAdmin ? req.user!.brandId : undefined
        },
        {
          page: Number(page),
          limit: Number(limit)
        },
        userId,
        isAdmin
      );

      res.json({
        status: 'success',
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // This would use a GetProductByIdUseCase
      const { ProductService } = await import('../../services/product.service');
      const product = await ProductService.getProductDetails(id);

      if (!product) {
        throw new ApplicationError('Product not found', 404);
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // This would use an UpdateProductUseCase
      const { ProductService } = await import('../../services/product.service');
      const product = await ProductService.updateProduct(id, req.body, userId);

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // This would use a DeleteProductUseCase
      const prisma = getPrismaClient();
      const productRepository = new PrismaProductRepository(prisma);
      
      const product = await productRepository.findById(id);
      if (!product) {
        throw new ApplicationError('Product not found', 404);
      }

      if (!product.canBeDeleted()) {
        throw new ApplicationError('Product cannot be deleted in current status', 400);
      }

      await productRepository.delete(id);

      res.json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}