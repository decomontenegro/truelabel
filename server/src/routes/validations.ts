import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireAdmin, requireBrandOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validação
const validationSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  reportId: z.string().optional(),
  type: z.enum(['MANUAL', 'LABORATORY']).default('MANUAL'),
  status: z.enum(['APPROVED', 'REJECTED', 'PARTIAL']),
  claimsValidated: z.record(z.any()).optional(),
  summary: z.string().optional(),
  notes: z.string().optional()
});

// Listar validações
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', status, productId } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    // Filtros
    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    // Se não for admin, só pode ver validações dos próprios produtos
    if (req.user!.role === 'BRAND') {
      where.product = {
        userId: req.user!.id
      };
    }

    const [validations, total] = await Promise.all([
      prisma.validation.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: { name: true, brand: true, sku: true }
          },
          report: {
            include: {
              laboratory: {
                select: { name: true, accreditation: true }
              }
            }
          },
          user: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.validation.count({ where })
    ]);

    // Convert status back to frontend format before sending response
    const normalizedValidations = validations.map(validation => {
      const normalized = { ...validation };
      if (normalized.status === 'VALIDATED') {
        normalized.status = 'APPROVED';
      }
      return normalized;
    });
    
    res.json({
      validations: normalizedValidations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obter validação específica
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isBrand = req.user!.role === 'BRAND';

    // Usar cache
    const validation = await cache.getOrSet(
      CacheKeys.validation(id),
      async () => {
        const where: any = { id };

        // Se não for admin, só pode ver validações dos próprios produtos
        if (isBrand) {
          where.product = {
            userId
          };
        }

        const validation = await prisma.validation.findFirst({
          where,
          include: {
            product: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            report: {
              include: {
                laboratory: true
              }
            },
            user: {
              select: { name: true, email: true }
            }
          }
        });

        if (!validation) {
          throw createError('Validação não encontrada', 404);
        }

        return validation;
      },
      CacheTTL.medium
    );

    // Convert status back to frontend format before sending response
    const responseValidation = { ...validation };
    if (responseValidation.status === 'VALIDATED') {
      responseValidation.status = 'APPROVED';
    }
    
    res.json({ validation: responseValidation });
  } catch (error) {
    next(error);
  }
});

// Criar validação (admin ou brand para seus próprios produtos)
router.post('/', authenticateToken, requireBrandOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    // Não pré-processar - deixar string vazia como está
    const preprocessedBody = req.body;

    const data = validationSchema.parse(preprocessedBody);

    // Validação manual para reportId
    if (data.type === 'LABORATORY' && (!data.reportId || data.reportId === '')) {
      throw createError('Relatório é obrigatório para validação laboratorial', 400);
    }

    if (data.reportId && data.reportId !== '' && !z.string().uuid().safeParse(data.reportId).success) {
      throw createError('ID do relatório deve ser um UUID válido', 400);
    }

    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    // Se for BRAND, só pode validar seus próprios produtos
    if (req.user!.role === 'BRAND' && product.userId !== req.user!.id) {
      throw createError('Você só pode validar seus próprios produtos', 403);
    }

    // Verificar se relatório existe (apenas para validação laboratorial)
    if (data.type === 'LABORATORY' && data.reportId) {
      const report = await prisma.report.findUnique({
        where: { id: data.reportId }
      });

      if (!report) {
        throw createError('Relatório não encontrado', 404);
      }
    }

    // Verificar se já existe validação para este produto
    const whereExisting: any = { productId: data.productId };
    if (data.reportId) {
      whereExisting.reportId = data.reportId;
    }

    const existingValidation = await prisma.validation.findFirst({
      where: whereExisting
    });

    if (existingValidation) {
      throw createError('Já existe uma validação para este produto', 409);
    }

    // Criar validação
    const validation = await prisma.validation.create({
      data: {
        productId: data.productId,
        reportId: data.reportId && data.reportId !== '' ? data.reportId : null,
        type: data.type,
        status: data.status,
        claimsValidated: JSON.stringify(data.claimsValidated || {}),
        summary: data.summary || null,
        notes: data.notes || null,
        userId: req.user!.id,
        validatedAt: data.status === 'APPROVED' ? new Date() : null
      },
      include: {
        product: {
          select: { name: true, brand: true, sku: true }
        },
        report: {
          include: {
            laboratory: {
              select: { name: true, accreditation: true }
            }
          }
        },
        user: {
          select: { name: true }
        }
      }
    });

    // Atualizar status do produto se aprovado
    if (data.status === 'APPROVED') {
      await prisma.product.update({
        where: { id: data.productId },
        data: { status: 'VALIDATED' }
      });
    } else if (data.status === 'REJECTED') {
      await prisma.product.update({
        where: { id: data.productId },
        data: { status: 'REJECTED' }
      });
    }

    // Invalidar cache
    await cache.invalidate(CacheKeys.validation(validation.id));
    await cache.invalidate(CacheKeys.product(data.productId));
    await cache.invalidate(CacheKeys.validationQueue());
    
    // Adicionar à fila se estiver pendente
    if (data.status === 'PENDING') {
      await cache.zadd(CacheKeys.validationQueue(), Date.now(), validation.id);
    }

    // Convert status back to frontend format before sending response
    const responseValidation = { ...validation };
    if (responseValidation.status === 'VALIDATED') {
      responseValidation.status = 'APPROVED';
    }
    
    res.status(201).json({
      message: 'Validação criada com sucesso',
      validation: responseValidation
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar validação (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = validationSchema.partial().parse(req.body);

    const existingValidation = await prisma.validation.findUnique({
      where: { id }
    });

    if (!existingValidation) {
      throw createError('Validação não encontrada', 404);
    }

    // Atualizar validação
    const validation = await prisma.validation.update({
      where: { id },
      data: {
        ...data,
        validatedAt: data.status === 'APPROVED' ? new Date() : existingValidation.validatedAt
      },
      include: {
        product: {
          select: { name: true, brand: true, sku: true }
        },
        report: {
          include: {
            laboratory: {
              select: { name: true, accreditation: true }
            }
          }
        },
        user: {
          select: { name: true }
        }
      }
    });

    // Atualizar status do produto
    if (data.status) {
      let productStatus = 'PENDING';
      if (data.status === 'APPROVED') {
        productStatus = 'VALIDATED';
      } else if (data.status === 'REJECTED') {
        productStatus = 'REJECTED';
      }

      await prisma.product.update({
        where: { id: existingValidation.productId },
        data: { status: productStatus as any }
      });
    }

    // Invalidar cache
    await cache.invalidate(CacheKeys.validation(id));
    await cache.invalidate(CacheKeys.product(existingValidation.productId));
    await cache.invalidate(CacheKeys.validationQueue());

    // Convert status back to frontend format before sending response
    const responseValidation = { ...validation };
    if (responseValidation.status === 'VALIDATED') {
      responseValidation.status = 'APPROVED';
    }
    
    res.json({
      message: 'Validação atualizada com sucesso',
      validation: responseValidation
    });
  } catch (error) {
    next(error);
  }
});

// Obter estatísticas de validações
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const isBrand = req.user!.role === 'BRAND';
    const cacheKey = CacheKeys.analytics('validation-stats', isBrand ? userId : 'all');

    // Usar cache
    const stats = await cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        // Se não for admin, só pode ver stats dos próprios produtos
        if (isBrand) {
          where.product = {
            userId
          };
        }

        const [total, approved, rejected, partial, pending] = await Promise.all([
          prisma.validation.count({ where }),
          prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
          prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
          prisma.validation.count({ where: { ...where, status: 'PARTIAL' } }),
          prisma.validation.count({ where: { ...where, status: 'PENDING' } })
        ]);

        // Validações por mês (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyValidations = await prisma.validation.groupBy({
          by: ['createdAt'],
          where: {
            ...where,
            createdAt: {
              gte: sixMonthsAgo
            }
          },
          _count: true
        });

        return {
          overview: {
            total,
            approved,
            rejected,
            partial,
            pending
          },
          monthlyTrend: monthlyValidations.map(item => ({
            month: item.createdAt,
            count: item._count
          }))
        };
      },
      CacheTTL.medium
    );

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Obter métricas de validações
router.get('/metrics', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const where: any = {};

    // Se não for admin, só pode ver métricas dos próprios produtos
    if (req.user!.role === 'BRAND') {
      where.product = {
        userId: req.user!.id
      };
    }

    const [total, approved, rejected, partial] = await Promise.all([
      prisma.validation.count({ where }),
      prisma.validation.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.validation.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.validation.count({ where: { ...where, status: 'PARTIAL' } })
    ]);

    // Métricas por tipo
    const byType = await prisma.validation.groupBy({
      by: ['type'],
      where,
      _count: true
    });

    // Tempo médio de validação (mock por enquanto)
    const avgValidationTime = 48; // horas

    res.json({
      metrics: {
        total,
        approved,
        rejected,
        partial,
        approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : 0,
        avgValidationTime,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obter fila de validações pendentes
router.get('/queue', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', priority } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    // Tentar buscar fila do cache Redis
    const queueIds = await cache.zrange(
      CacheKeys.validationQueue(), 
      0, 
      -1,
      true
    );

    // Se tiver dados no cache, usar
    if (queueIds.length > 0) {
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginatedIds = queueIds.slice(start * 2, end * 2); // *2 porque inclui scores
      
      // Buscar detalhes das validações
      const validationIds = [];
      for (let i = 0; i < paginatedIds.length; i += 2) {
        validationIds.push(paginatedIds[i]);
      }
      
      const validations = await prisma.validation.findMany({
        where: {
          id: { in: validationIds },
          status: 'PENDING'
        },
        include: {
          product: {
            select: { 
              name: true, 
              brand: true, 
              sku: true,
              createdAt: true
            }
          },
          report: {
            select: {
              laboratory: {
                select: { name: true }
              }
            }
          }
        }
      });

      const queueWithEstimates = validations.map((item, index) => ({
        ...item,
        position: start + index + 1,
        estimatedTime: (start + index + 1) * 24,
        priority: 'NORMAL'
      }));

      res.json({
        queue: queueWithEstimates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: queueIds.length / 2,
          pages: Math.ceil(queueIds.length / 2 / limitNum)
        },
        summary: {
          totalPending: queueIds.length / 2,
          estimatedClearTime: (queueIds.length / 2) * 24
        }
      });
      return;
    }

    // Fallback para busca no banco
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const where: any = {
      status: 'PENDING'
    };

    // Se não for admin, só pode ver fila dos próprios produtos
    if (req.user!.role === 'BRAND') {
      where.product = {
        userId: req.user!.id
      };
    }

    // Filtro por prioridade (mock - pode ser implementado depois)
    if (priority) {
      // Aqui poderia ter lógica de prioridade baseada em critérios do negócio
    }

    const [queue, total] = await Promise.all([
      prisma.validation.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: { 
              name: true, 
              brand: true, 
              sku: true,
              createdAt: true
            }
          },
          report: {
            select: {
              laboratory: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' } // FIFO - primeiro a entrar, primeiro a sair
      }),
      prisma.validation.count({ where })
    ]);

    // Adicionar à fila do Redis para próximas consultas
    for (const validation of queue) {
      await cache.zadd(
        CacheKeys.validationQueue(),
        new Date(validation.createdAt).getTime(),
        validation.id
      );
    }

    // Adicionar tempo de espera estimado (mock)
    const queueWithEstimates = queue.map((item, index) => ({
      ...item,
      position: skip + index + 1,
      estimatedTime: (skip + index + 1) * 24, // 24 horas por validação (mock)
      priority: 'NORMAL' // pode ser calculado com base em critérios
    }));

    res.json({
      queue: queueWithEstimates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      summary: {
        totalPending: total,
        estimatedClearTime: total * 24 // horas
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
