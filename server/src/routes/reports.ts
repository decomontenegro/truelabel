import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireLabOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { uploadReport } from '../middleware/upload';
import crypto from 'crypto';
import fs from 'fs';
import { cache, CacheKeys, CacheTTL } from '../lib/redis';

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validação para relatório
const reportSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  laboratoryId: z.string().uuid('ID do laboratório inválido'),
  analysisType: z.string().min(1, 'Tipo de análise é obrigatório'),
  results: z.any().optional()
});

// Listar relatórios
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', productId, laboratoryId } = req.query;
    const userId = req.user!.id;
    const isBrand = req.user!.role === 'BRAND';
    
    // Criar cache key se tiver productId
    const useCache = productId && !laboratoryId;
    const cacheKey = useCache ? CacheKeys.reportList(productId as string) : null;
    
    if (cacheKey) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    // Filtros
    if (productId) {
      where.productId = productId;
    }

    if (laboratoryId) {
      where.laboratoryId = laboratoryId;
    }

    // Se não for admin, só pode ver relatórios dos próprios produtos
    if (isBrand) {
      where.product = {
        userId
      };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: { name: true, brand: true, sku: true }
          },
          laboratory: {
            select: { name: true, accreditation: true }
          },
          validations: {
            select: { status: true, validatedAt: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where })
    ]);

    const response = {
      reports,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    };
    
    // Salvar no cache se aplicável
    if (cacheKey) {
      await cache.set(cacheKey, response, CacheTTL.short);
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Obter relatório específico
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isBrand = req.user!.role === 'BRAND';

    // Usar cache
    const report = await cache.getOrSet(
      CacheKeys.report(id),
      async () => {
        const where: any = { id };

        // Se não for admin, só pode ver relatórios dos próprios produtos
        if (isBrand) {
          where.product = {
            userId
          };
        }

        const report = await prisma.report.findFirst({
          where,
          include: {
            product: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            laboratory: true,
            validations: {
              include: {
                user: {
                  select: { name: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        if (!report) {
          throw createError('Relatório não encontrado', 404);
        }

        return report;
      },
      CacheTTL.medium
    );

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

// Upload de relatório
router.post('/', authenticateToken, requireLabOrAdmin, uploadReport, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw createError('Arquivo de relatório é obrigatório', 400);
    }

    const data = reportSchema.parse(req.body);

    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    });

    if (!product) {
      throw createError('Produto não encontrado', 404);
    }

    // Verificar se laboratório existe
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: data.laboratoryId }
    });

    if (!laboratory) {
      throw createError('Laboratório não encontrado', 404);
    }

    // Gerar hash do arquivo para verificação de integridade
    const fileBuffer = fs.readFileSync(req.file.path);
    const verificationHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Criar relatório
    const report = await prisma.report.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        analysisType: data.analysisType,
        results: data.results || {},
        verificationHash,
        productId: data.productId,
        laboratoryId: data.laboratoryId
      },
      include: {
        product: {
          select: { name: true, brand: true, sku: true }
        },
        laboratory: {
          select: { name: true, accreditation: true }
        }
      }
    });

    // Invalidar cache
    await cache.invalidate(CacheKeys.reportList(data.productId));
    
    // Salvar no cache
    await cache.set(CacheKeys.report(report.id), report, CacheTTL.medium);

    res.status(201).json({
      message: 'Relatório enviado com sucesso',
      report
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar resultados do relatório
router.put('/:id/results', authenticateToken, requireLabOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      throw createError('Relatório não encontrado', 404);
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { results },
      include: {
        product: {
          select: { name: true, brand: true }
        },
        laboratory: {
          select: { name: true }
        }
      }
    });

    // Invalidar cache
    await cache.invalidate(CacheKeys.report(id));
    await cache.invalidate(CacheKeys.reportList(report.productId));

    res.json({
      message: 'Resultados atualizados com sucesso',
      report: updatedReport
    });
  } catch (error) {
    next(error);
  }
});

// Verificar integridade do arquivo
router.post('/:id/verify', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      throw createError('Relatório não encontrado', 404);
    }

    // Verificar se arquivo ainda existe
    if (!fs.existsSync(report.filePath)) {
      throw createError('Arquivo não encontrado no servidor', 404);
    }

    // Calcular hash atual do arquivo
    const fileBuffer = fs.readFileSync(report.filePath);
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const isValid = currentHash === report.verificationHash;

    // Atualizar status de verificação
    await prisma.report.update({
      where: { id },
      data: { isVerified: isValid }
    });

    res.json({
      isValid,
      message: isValid ? 'Arquivo íntegro' : 'Arquivo foi modificado',
      originalHash: report.verificationHash,
      currentHash
    });
  } catch (error) {
    next(error);
  }
});

// Download do arquivo do relatório
router.get('/:id/download', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const where: any = { id };

    // Se não for admin, só pode baixar relatórios dos próprios produtos
    if (req.user!.role === 'BRAND') {
      where.product = {
        userId: req.user!.id
      };
    }

    const report = await prisma.report.findFirst({
      where
    });

    if (!report) {
      throw createError('Relatório não encontrado', 404);
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(report.filePath)) {
      throw createError('Arquivo não encontrado no servidor', 404);
    }

    res.download(report.filePath, report.originalName);
  } catch (error) {
    next(error);
  }
});

// Parse report
router.post('/:id/parse', authenticateToken, requireLabOrAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const reportParserService = require('../services/reportParserService').default;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      throw createError('Relatório não encontrado', 404);
    }

    // Parse the report
    const parsedData = await reportParserService.parseReport(id);

    res.json({
      message: 'Relatório analisado com sucesso',
      parsedData
    });
  } catch (error) {
    next(error);
  }
});

export default router;
