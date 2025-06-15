import { PrismaClient } from '@prisma/client';
import { productQueries, QueryPerformanceMonitor } from '../utils/database/prisma-optimizations';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('ProductService');
const prisma = new PrismaClient();

export interface ProductFilter {
  search?: string;
  category?: string;
  status?: string;
  brandId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export class ProductService {
  /**
   * Get products with optimized queries
   */
  static async getProducts(
    filters: ProductFilter,
    pagination: PaginationParams,
    userId?: string,
    isAdmin: boolean = false
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (!isAdmin && userId) {
      where.userId = userId;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ean: { contains: filters.search } },
        { brand: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Use optimized query
    const queryParams = productQueries.findManyOptimized({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Execute with performance monitoring
    const result = await QueryPerformanceMonitor.measureQuery(
      'getProducts',
      async () => {
        const [products, total] = await Promise.all([
          prisma.product.findMany(queryParams),
          prisma.product.count({ where })
        ]);

        return { products, total };
      }
    );

    return {
      products: result.products,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
        hasMore: page * limit < result.total
      }
    };
  }

  /**
   * Get product details with all related data
   */
  static async getProductDetails(productId: string) {
    const cacheKey = CacheKeys.productDetails ? CacheKeys.productDetails(productId) : `product:${productId}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      log.debug('Product details loaded from cache', { productId });
      return cached;
    }

    // Use optimized query
    const product = await QueryPerformanceMonitor.measureQuery(
      'getProductDetails',
      () => prisma.product.findUnique(productQueries.findWithFullDetails(productId))
    );

    if (product) {
      // Cache the result
      await cache.set(cacheKey, product, CacheTTL.PRODUCT_DETAILS || 300);
    }

    return product;
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(brandId?: string) {
    const cacheKey = brandId 
      ? `stats:brand:${brandId}` 
      : 'stats:all';

    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await QueryPerformanceMonitor.measureQuery(
      'getDashboardStats',
      async () => {
        const [productStats, validationStats, totalProducts] = await Promise.all([
          // Product statistics by status
          prisma.product.groupBy({
            by: ['status'],
            where: brandId ? { brandId } : {},
            _count: true
          }),
          
          // Recent validation statistics
          prisma.validation.groupBy({
            by: ['status'],
            where: brandId ? { product: { brandId } } : {},
            _count: true
          }),

          // Total count
          prisma.product.count({
            where: brandId ? { brandId } : {}
          })
        ]);

        // Process stats
        const productsByStatus = productStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>);

        const validationsByStatus = validationStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalProducts,
          productsByStatus,
          validationsByStatus,
          activeProducts: productsByStatus['ACTIVE'] || 0,
          pendingValidations: validationsByStatus['PENDING'] || 0,
          completedValidations: validationsByStatus['VALIDATED'] || 0
        };
      }
    );

    // Cache for 5 minutes
    await cache.set(cacheKey, stats, 300);
    
    return stats;
  }

  /**
   * Search products with optimized query
   */
  static async searchProducts(searchTerm: string, filters?: ProductFilter) {
    return QueryPerformanceMonitor.measureQuery(
      'searchProducts',
      () => prisma.product.findMany(searchQueries.searchProducts(searchTerm, filters))
    );
  }

  /**
   * Create product with transaction
   */
  static async createProduct(data: any, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          ...data,
          userId,
          status: 'DRAFT'
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_PRODUCT',
          targetType: 'Product',
          targetId: product.id,
          details: { productName: product.name }
        }
      });

      // Clear cache
      await cache.invalidatePattern(`products:*:${userId}:*`);
      await cache.invalidatePattern('stats:*');

      log.info('Product created', { productId: product.id, userId });

      return product;
    });
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, data: any, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Get current product for audit
      const currentProduct = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      // Update product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_PRODUCT',
          targetType: 'Product',
          targetId: productId,
          details: {
            changes: Object.keys(data),
            before: currentProduct,
            after: updatedProduct
          }
        }
      });

      // Clear cache
      await cache.del(CacheKeys.productDetails ? CacheKeys.productDetails(productId) : `product:${productId}`);
      await cache.invalidatePattern(`products:*`);
      await cache.invalidatePattern('stats:*');

      log.info('Product updated', { productId, userId });

      return updatedProduct;
    });
  }

  /**
   * Batch update product status
   */
  static async batchUpdateStatus(productIds: string[], status: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Update all products
      const result = await batchOperations.updateManyProductStatus(tx, productIds, status);

      // Create audit logs
      await tx.auditLog.createMany({
        data: productIds.map(productId => ({
          userId,
          action: 'UPDATE_PRODUCT_STATUS',
          targetType: 'Product',
          targetId: productId,
          details: { newStatus: status }
        }))
      });

      // Clear cache for all affected products
      await Promise.all(
        productIds.map(id => 
          cache.del(CacheKeys.productDetails ? CacheKeys.productDetails(id) : `product:${id}`)
        )
      );
      await cache.invalidatePattern('products:*');
      await cache.invalidatePattern('stats:*');

      log.info('Batch product status update', { count: result.count, status, userId });

      return result;
    });
  }

  /**
   * Get product validation history
   */
  static async getProductValidationHistory(productId: string) {
    const cacheKey = `product:${productId}:validations`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const validations = await prisma.validation.findMany({
      where: { productId },
      include: {
        laboratory: {
          select: {
            name: true,
            accreditation: true
          }
        },
        labResults: {
          select: {
            testType: true,
            result: true,
            passed: true,
            unit: true
          }
        },
        prescriber: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    await cache.set(cacheKey, validations, 600); // Cache for 10 minutes

    return validations;
  }
}

// Import missing dependencies
import { searchQueries, batchOperations } from '../utils/database/prisma-optimizations';

export default ProductService;