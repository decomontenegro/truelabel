import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireBrandOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { uploadProductImage } from '../middleware/upload';
import { generateQRCode } from '../utils/qrCode';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validação para produto
const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  brand: z.string().min(2, 'Marca deve ter pelo menos 2 caracteres'),
  category: z.string().min(2, 'Categoria é obrigatória'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  batchNumber: z.string().optional(),
  nutritionalInfo: z.any().optional(),
  claims: z.string().optional()
});

// Listar produtos do usuário
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', search, category, status } = req.query;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    
    // Criar cache key baseada nos parâmetros
    const cacheKey = isAdmin 
      ? `products:all:${page}:${limit}:${search || ''}:${category || ''}:${status || ''}`
      : CacheKeys.productList(userId, parseInt(page as string));

    // Tentar buscar do cache primeiro
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    // Filtrar por usuário (exceto admin)
    if (!isAdmin) {
      where.userId = userId;
    }

    // Filtros opcionais
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { brand: { contains: search as string } },
        { sku: { contains: search as string } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { name: true, email: true }
          },
          validations: {
            select: { status: true, validatedAt: true }
          },
          _count: {
            select: { reports: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    const response = {
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    };

    // Salvar no cache
    await cache.set(cacheKey, response, CacheTTL.short);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Obter produto específico
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    // Usar cache
    const product = await cache.getOrSet(
      CacheKeys.product(id),
      async () => {
        const where: any = { id };

        // Usuários não-admin só podem ver seus próprios produtos
        if (!isAdmin) {
          where.userId = userId;
        }

        const product = await prisma.product.findFirst({
          where,
          include: {
            user: {
              select: { name: true, email: true, role: true }
            },
            validations: {
              include: {
                report: {
                  select: {
                    id: true,
                    fileName: true,
                    analysisType: true,
                    results: true,
                    laboratory: {
                      select: { name: true, accreditation: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            reports: {
              include: {
                laboratory: {
                  select: { name: true, accreditation: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        if (!product) {
          throw createError('Produto não encontrado', 404);
        }

        return product;
      },
      CacheTTL.medium
    );

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// Criar produto
router.post('/', authenticateToken, requireBrandOrAdmin, uploadProductImage, async (req: AuthRequest, res, next) => {
  try {
    console.log('📝 Dados recebidos:', req.body);
    const data = productSchema.parse(req.body);
    console.log('✅ Dados após validação:', data);

    // Claims já é string agora
    const claimsString = data.claims || '';
    console.log('🏷️ Claims processados:', claimsString);

    // Verificar se SKU já existe
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku }
    });

    if (existingSku) {
      throw createError('SKU já existe', 409);
    }

    // Processar imagem se enviada
    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand,
        category: data.category,
        description: data.description || null,
        sku: data.sku,
        batchNumber: data.batchNumber || null,
        nutritionalInfo: typeof data.nutritionalInfo === 'string' ? data.nutritionalInfo : JSON.stringify(data.nutritionalInfo || {}),
        claims: claimsString,
        imageUrl,
        user: {
          connect: { id: req.user!.id }
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Invalidar cache de lista de produtos
    await cache.invalidate(`products:${req.user!.id}:*`);
    if (req.user!.role === 'ADMIN') {
      await cache.invalidate('products:all:*');
    }

    // Salvar no cache
    await cache.set(CacheKeys.product(product.id), product, CacheTTL.medium);
    await cache.set(CacheKeys.productBySku(product.sku), product.id, CacheTTL.long);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar produto
router.put('/:id', authenticateToken, requireBrandOrAdmin, uploadProductImage, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = productSchema.partial().parse(req.body);

    const where: any = { id };

    // Usuários não-admin só podem editar seus próprios produtos
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    // Verificar se produto existe
    const existingProduct = await prisma.product.findFirst({ where });
    if (!existingProduct) {
      throw createError('Produto não encontrado', 404);
    }

    // Processar nova imagem se enviada
    let updateData: any = { ...data };
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Invalidar cache
    await cache.invalidate(CacheKeys.product(id));
    await cache.invalidate(`products:${req.user!.id}:*`);
    if (req.user!.role === 'ADMIN') {
      await cache.invalidate('products:all:*');
    }
    if (data.sku && existingProduct.sku !== data.sku) {
      await cache.invalidate(CacheKeys.productBySku(existingProduct.sku));
      await cache.set(CacheKeys.productBySku(data.sku), id, CacheTTL.long);
    }

    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });
  } catch (error) {
    next(error);
  }
});

// Gerar QR Code para produto
router.post('/:id/qr-code', authenticateToken, requireBrandOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const where: any = { id };

    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    const product = await prisma.product.findFirst({ where });
    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    // Gerar QR code único
    const qrCode = await generateQRCode(id);

    // Atualizar produto com QR code
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { qrCode }
    });

    res.json({
      message: 'QR Code gerado com sucesso',
      qrCode,
      validationUrl: `${process.env.QR_CODE_BASE_URL}/${qrCode}`
    });
  } catch (error) {
    next(error);
  }
});

// Enviar produto para validação
router.post('/:id/submit-for-validation', authenticateToken, requireBrandOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const where: any = { id };

    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    const product = await prisma.product.findFirst({ where });
    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    if (product.status !== 'DRAFT') {
      throw createError('Produto já foi enviado para validação', 400);
    }

    // Atualizar status para PENDING
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status: 'PENDING' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({
      message: 'Produto enviado para validação com sucesso',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
});

// Deletar produto
router.delete('/:id', authenticateToken, requireBrandOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const where: any = { id };

    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    const product = await prisma.product.findFirst({ where });
    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    await prisma.product.delete({ where: { id } });

    // Invalidar cache
    await cache.invalidate(CacheKeys.product(id));
    await cache.invalidate(`products:${req.user!.id}:*`);
    if (req.user!.role === 'ADMIN') {
      await cache.invalidate('products:all:*');
    }
    if (product.sku) {
      await cache.invalidate(CacheKeys.productBySku(product.sku));
    }

    res.json({
      message: 'Produto deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
