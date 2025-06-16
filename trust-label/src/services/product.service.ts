import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { addValidationJob } from './queue';
import { CertificationService } from './certifications.service';

interface ProductFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  brandId?: string;
}

interface CreateProductData {
  brandId: string;
  name: string;
  description?: string;
  barcode: string;
  sku: string;
  category: string;
  image?: string;
  claims?: Array<{
    type: string;
    category: string;
    value: string;
    unit?: string;
    description?: string;
  }>;
}

export class ProductService {
  static async listProducts(filters: ProductFilters) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      brandId,
    } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              validations: true,
              qrCodes: true,
              claims: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        claims: true,
        validations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            laboratory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        qrCodes: {
          where: { isActive: true },
          take: 1,
        },
        certifications: {
          where: {
            verified: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check certification compliance
    const compliance = await CertificationService.checkCompliance(productId);

    return {
      ...product,
      compliance,
    };
  }

  static async createProduct(data: CreateProductData) {
    // Verificar se SKU ou barcode já existem
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode: data.barcode },
          { sku: data.sku },
        ],
      },
    });

    if (existing) {
      throw new AppError('Product with this barcode or SKU already exists', 409);
    }

    // Criar produto com claims
    const product = await prisma.product.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        sku: data.sku,
        category: data.category,
        images: data.image ? [data.image] : [],
        status: 'DRAFT',
        claims: {
          create: data.claims || [],
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        claims: true,
      },
    });

    logger.info(`Product created: ${product.id} - ${product.name}`);

    // Adicionar certificações obrigatórias
    const requiredCerts = CertificationService.getRequiredCertifications(product.category);
    if (requiredCerts.length > 0) {
      logger.info(`Product ${product.id} requires certifications: ${requiredCerts.join(', ')}`);
    }

    return product;
  }

  static async updateProduct(productId: string, data: Partial<CreateProductData>) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Verificar duplicação se atualizando SKU ou barcode
    if (data.barcode || data.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          id: { not: productId },
          OR: [
            data.barcode ? { barcode: data.barcode } : {},
            data.sku ? { sku: data.sku } : {},
          ],
        },
      });

      if (existing) {
        throw new AppError('Product with this barcode or SKU already exists', 409);
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        sku: data.sku,
        category: data.category,
        images: data.image ? { push: data.image } : undefined,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Product updated: ${productId}`);

    return updated;
  }

  static async deleteProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            validations: true,
            qrCodes: { where: { scans: { gt: 0 } } },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Não permitir deletar produtos com validações ou QR codes escaneados
    if (product._count.validations > 0) {
      throw new AppError('Cannot delete product with validations', 400);
    }

    if (product._count.qrCodes > 0) {
      throw new AppError('Cannot delete product with scanned QR codes', 400);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    logger.info(`Product deleted: ${productId}`);
  }

  static async validateProduct(productId: string, laboratoryId?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        claims: true,
        validations: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.claims.length === 0) {
      throw new AppError('Product must have claims before validation', 400);
    }

    // Verificar se já tem validação pendente
    if (product.validations.length > 0) {
      throw new AppError('Product already has pending validation', 400);
    }

    // Criar validação
    const validation = await prisma.validation.create({
      data: {
        productId,
        laboratoryId: laboratoryId || undefined,
        status: 'PENDING',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        reportNumber: `VAL-${Date.now()}`,
        reportUrl: '',
      },
    });

    // Atualizar status do produto
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'PENDING_VALIDATION' },
    });

    // Adicionar job de validação na fila
    await addValidationJob({
      productId,
      validationId: validation.id,
    });

    logger.info(`Validation started for product ${productId}`);

    return validation;
  }

  static async addClaim(productId: string, claimData: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const claim = await prisma.claim.create({
      data: {
        productId,
        ...claimData,
      },
    });

    logger.info(`Claim added to product ${productId}`);

    return claim;
  }

  static async addCertification(productId: string, certData: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Validar certificação
    const verified = await CertificationService.validateCertification(productId, {
      ...certData,
      verified: false,
    });

    const certification = await prisma.certification.findFirst({
      where: {
        productId,
        type: certData.type,
        number: certData.number,
      },
    });

    logger.info(`Certification ${certData.type} added to product ${productId}`);

    return certification;
  }
}