import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, CreateClaimDto } from './dto/product.dto';
import { User, UserRole, ProductStatus, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, user: User) {
    // Only brands can create products
    if (user.role !== UserRole.BRAND) {
      throw new ForbiddenException('Only brands can create products');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { userId: user.id },
    });

    if (!brand) {
      throw new NotFoundException('Brand profile not found');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        brandId: brand.id,
        images: createProductDto.images || [],
      },
      include: {
        brand: true,
        claims: true,
        _count: {
          select: {
            validations: true,
            qrCodes: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    const { skip = 0, take = 10, where, orderBy } = params;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          brand: true,
          _count: {
            select: {
              claims: true,
              validations: true,
              qrCodes: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        perPage: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        claims: {
          orderBy: { createdAt: 'desc' },
        },
        validations: {
          include: {
            laboratory: true,
            claims: {
              include: {
                claim: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        qrCodes: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        brand: true,
        claims: true,
        validations: {
          where: {
            status: 'VALIDATED',
            validUntil: { gte: new Date() },
          },
        },
        qrCodes: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.findOne(id);

    // Check permissions
    if (user.role === UserRole.BRAND) {
      const brand = await this.prisma.brand.findUnique({
        where: { userId: user.id },
      });

      if (product.brandId !== brand?.id) {
        throw new ForbiddenException('You can only update your own products');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        brand: true,
        claims: true,
      },
    });
  }

  async remove(id: string, user: User) {
    const product = await this.findOne(id);

    // Check permissions
    if (user.role === UserRole.BRAND) {
      const brand = await this.prisma.brand.findUnique({
        where: { userId: user.id },
      });

      if (product.brandId !== brand?.id) {
        throw new ForbiddenException('You can only delete your own products');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Soft delete by changing status
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.SUSPENDED },
    });
  }

  async addClaim(productId: string, createClaimDto: CreateClaimDto, user: User) {
    const product = await this.findOne(productId);

    // Check permissions
    if (user.role === UserRole.BRAND) {
      const brand = await this.prisma.brand.findUnique({
        where: { userId: user.id },
      });

      if (product.brandId !== brand?.id) {
        throw new ForbiddenException('You can only add claims to your own products');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.claim.create({
      data: {
        ...createClaimDto,
        productId,
      },
    });
  }

  async removeClaim(productId: string, claimId: string, user: User) {
    const product = await this.findOne(productId);

    // Check permissions
    if (user.role === UserRole.BRAND) {
      const brand = await this.prisma.brand.findUnique({
        where: { userId: user.id },
      });

      if (product.brandId !== brand?.id) {
        throw new ForbiddenException('You can only remove claims from your own products');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.claim.delete({
      where: { id: claimId },
    });
  }

  async getProductsByBrand(brandId: string, params: {
    skip?: number;
    take?: number;
    status?: ProductStatus;
  }) {
    return this.findAll({
      ...params,
      where: {
        brandId,
        ...(params.status && { status: params.status }),
      },
    });
  }

  async searchProducts(query: string, params: {
    skip?: number;
    take?: number;
  }) {
    return this.findAll({
      ...params,
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query } },
          { sku: { contains: query } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
        ],
        status: ProductStatus.VALIDATED,
      },
    });
  }
}