import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Schema para geração de QR code
const generateQRSchema = z.object({
  productId: z.string().uuid('ID do produto inválido')
});

// Gerar QR code para um produto
export const generateQRCode = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { productId } = generateQRSchema.parse(req.body);

    // Verificar se o produto existe e pertence ao usuário (ou se é admin)
    const where: any = { id: productId };
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    const product = await prisma.product.findFirst({ where });

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    // Verificar se já existe QR Code (PROTEÇÃO CRÍTICA)
    let qrCode = product.qrCode;
    if (qrCode) {
      // QR Code já existe - NUNCA regenerar para proteger produtos impressos
      console.log(`⚠️  QR Code já existe para produto ${product.name}: ${qrCode}`);
    } else {
      // Gerar código único apenas se não existir
      // Adicionar componente aleatório para tornar o QR code imprevisível
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const uniqueString = `${product.id}-${product.sku}-${randomBytes}-${Date.now()}`;
      qrCode = crypto
        .createHash('sha256')
        .update(uniqueString)
        .digest('hex')
        .substring(0, 16); // Usar apenas 16 caracteres

      // Atualizar produto com o QR code
      await prisma.product.update({
        where: { id: productId },
        data: { qrCode }
      });

      console.log(`✅ Novo QR Code gerado para produto ${product.name}: ${qrCode}`);
    }

    // URL base para validação
    const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:3000/validation';
    const validationUrl = `${baseUrl}/${qrCode}`;

    // Gerar imagem do QR code
    const qrCodeImage = await QRCode.toDataURL(validationUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return res.json({
      qrCode,
      validationUrl,
      qrCodeImage,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao gerar QR code:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Validar QR code (endpoint público)
export const validateQRCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        error: 'Código QR é obrigatório'
      });
    }

    // Buscar produto pelo QR code
    const product = await prisma.product.findUnique({
      where: { qrCode },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        validations: {
          where: {
            status: 'APPROVED'
          },
          include: {
            report: {
              include: {
                laboratory: {
                  select: {
                    name: true,
                    accreditation: true
                  }
                }
              }
            }
          },
          orderBy: {
            validatedAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado',
        message: 'Este código QR não corresponde a nenhum produto validado.'
      });
    }

    // Registrar acesso ao QR code
    await prisma.qRCodeAccess.create({
      data: {
        qrCode,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        // location poderia ser adicionado via geolocalização
      }
    });

    // Preparar dados de resposta
    const latestValidation = product.validations[0];

    const response = {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        description: product.description,
        claims: product.claims,
        nutritionalInfo: product.nutritionalInfo,
        imageUrl: product.imageUrl,
        status: product.status,
        batchNumber: product.batchNumber
      },
      brand: {
        name: product.user.name,
        email: product.user.email
      },
      validation: latestValidation ? {
        id: latestValidation.id,
        status: latestValidation.status,
        claimsValidated: latestValidation.claimsValidated,
        summary: latestValidation.summary,
        validatedAt: latestValidation.validatedAt,
        laboratory: latestValidation.report?.laboratory || {
          name: 'Laboratório não especificado',
          accreditation: 'N/A'
        }
      } : null,
      isValidated: latestValidation?.status === 'APPROVED',
      lastUpdated: latestValidation?.validatedAt || product.updatedAt,
      accessedAt: new Date().toISOString()
    };

    return res.json(response);

  } catch (error) {
    console.error('Erro na validação do QR code:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar acessos ao QR code (para o dono do produto)
export const getQRCodeAccesses = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { productId } = req.params;

    // Verificar se o produto existe e pertence ao usuário (ou se é admin)
    const where: any = { id: productId };
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    }

    const product = await prisma.product.findFirst({ where });

    if (!product || !product.qrCode) {
      return res.status(404).json({
        error: 'Produto não encontrado ou QR code não gerado'
      });
    }

    // Buscar acessos
    const accesses = await prisma.qRCodeAccess.findMany({
      where: {
        qrCode: product.qrCode
      },
      orderBy: {
        accessedAt: 'desc'
      },
      take: 100 // Limitar a 100 acessos mais recentes
    });

    // Estatísticas básicas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAccesses = accesses.filter(
      access => access.accessedAt >= today
    ).length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const weekAccesses = accesses.filter(
      access => access.accessedAt >= thisWeek
    ).length;

    return res.json({
      accesses: accesses.map(access => ({
        id: access.id,
        ipAddress: access.ipAddress,
        userAgent: access.userAgent,
        location: access.location,
        accessedAt: access.accessedAt
      })),
      statistics: {
        total: accesses.length,
        today: todayAccesses,
        thisWeek: weekAccesses
      }
    });

  } catch (error) {
    console.error('Erro ao buscar acessos:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
