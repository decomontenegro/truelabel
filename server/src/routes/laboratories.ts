import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validação para laboratório
const laboratorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  accreditation: z.string().min(1, 'Acreditação é obrigatória'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Listar laboratórios (rota pública para seleção)
router.get('/', async (req, res, next) => {
  try {
    const { page = '1', limit = '10', search, active } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    // Filtros
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { accreditation: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const [laboratories, total] = await Promise.all([
      prisma.laboratory.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          accreditation: true,
          email: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { reports: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.laboratory.count({ where })
    ]);

    res.json({
      laboratories,
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

// Obter laboratório específico
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const laboratory = await prisma.laboratory.findUnique({
      where: { id },
      include: {
        reports: {
          include: {
            product: {
              select: { name: true, brand: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimos 10 relatórios
        },
        _count: {
          select: { reports: true }
        }
      }
    });

    if (!laboratory) {
      throw createError('Laboratório não encontrado', 404);
    }

    res.json({ laboratory });
  } catch (error) {
    next(error);
  }
});

// Criar laboratório (apenas admin)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = laboratorySchema.parse(req.body);

    // Verificar se email já existe
    const existingLab = await prisma.laboratory.findUnique({
      where: { email: data.email }
    });

    if (existingLab) {
      throw createError('Email já está em uso', 409);
    }

    const laboratory = await prisma.laboratory.create({
      data,
      select: {
        id: true,
        name: true,
        accreditation: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Laboratório criado com sucesso',
      laboratory
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar laboratório (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = laboratorySchema.partial().parse(req.body);

    const existingLab = await prisma.laboratory.findUnique({
      where: { id }
    });

    if (!existingLab) {
      throw createError('Laboratório não encontrado', 404);
    }

    // Se email está sendo alterado, verificar se não existe
    if (data.email && data.email !== existingLab.email) {
      const emailExists = await prisma.laboratory.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        throw createError('Email já está em uso', 409);
      }
    }

    const laboratory = await prisma.laboratory.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        accreditation: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Laboratório atualizado com sucesso',
      laboratory
    });
  } catch (error) {
    next(error);
  }
});

// Ativar/Desativar laboratório (apenas admin)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = z.object({
      isActive: z.boolean()
    }).parse(req.body);

    const laboratory = await prisma.laboratory.findUnique({
      where: { id }
    });

    if (!laboratory) {
      throw createError('Laboratório não encontrado', 404);
    }

    const updatedLab = await prisma.laboratory.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    res.json({
      message: `Laboratório ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      laboratory: updatedLab
    });
  } catch (error) {
    next(error);
  }
});

// Obter estatísticas do laboratório
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;

    const laboratory = await prisma.laboratory.findUnique({
      where: { id },
      select: { name: true }
    });

    if (!laboratory) {
      throw createError('Laboratório não encontrado', 404);
    }

    const [totalReports, validatedReports, pendingReports] = await Promise.all([
      prisma.report.count({
        where: { laboratoryId: id }
      }),
      prisma.report.count({
        where: {
          laboratoryId: id,
          validations: {
            some: { status: 'APPROVED' }
          }
        }
      }),
      prisma.report.count({
        where: {
          laboratoryId: id,
          validations: {
            some: { status: 'PENDING' }
          }
        }
      })
    ]);

    // Relatórios por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyReports = await prisma.report.groupBy({
      by: ['createdAt'],
      where: {
        laboratoryId: id,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: true
    });

    res.json({
      laboratory: {
        name: laboratory.name
      },
      stats: {
        totalReports,
        validatedReports,
        pendingReports,
        monthlyTrend: monthlyReports.map(item => ({
          month: item.createdAt,
          count: item._count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
