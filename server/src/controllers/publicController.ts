import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema para validação de produto público
const validateProductSchema = z.object({
  qrCode: z.string().min(1, 'QR Code é obrigatório')
});

// API pública para validação de produtos
export const validateProduct = async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR Code é obrigatório'
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
          take: 5 // Últimas 5 validações
        },
        reports: {
          where: {
            isVerified: true
          },
          include: {
            laboratory: {
              select: {
                name: true,
                accreditation: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Últimos 3 laudos verificados
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
        message: 'Este QR Code não corresponde a nenhum produto validado em nossa base de dados.'
      });
    }

    // Registrar acesso ao QR code
    await prisma.qRCodeAccess.create({
      data: {
        qrCode,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        // Adicionar geolocalização se disponível
        location: req.get('CF-IPCountry') || null // Cloudflare country header
      }
    });

    // Preparar dados de resposta
    const latestValidation = product.validations[0];
    const hasValidValidation = !!latestValidation;

    // Calcular score de confiabilidade
    const trustScore = calculateTrustScore(product);

    const response = {
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          claims: product.claims,
          nutritionalInfo: product.nutritionalInfo,
          imageUrl: product.imageUrl,
          status: product.status,
          createdAt: product.createdAt
        },
        brand: {
          name: product.user.name,
          email: product.user.email
        },
        validation: hasValidValidation && latestValidation.report ? {
          id: latestValidation.id,
          status: latestValidation.status,
          claimsValidated: latestValidation.claimsValidated,
          summary: latestValidation.summary,
          validatedAt: latestValidation.validatedAt,
          laboratory: latestValidation.report.laboratory,
          reportId: latestValidation.report.id
        } : null,
        reports: product.reports.map(report => ({
          id: report.id,
          analysisType: report.analysisType,
          isVerified: report.isVerified,
          laboratory: report.laboratory,
          createdAt: report.createdAt
        })),
        trustScore,
        validationCount: product.validations.length,
        lastValidated: latestValidation?.validatedAt || null,
        accessedAt: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro na validação pública:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Função para calcular score de confiabilidade
function calculateTrustScore(product: any): number {
  let score = 0;
  const maxScore = 100;

  // Pontos por validações aprovadas (40 pontos máximo)
  const validValidations = product.validations.length;
  score += Math.min(validValidations * 10, 40);

  // Pontos por laudos verificados (30 pontos máximo)
  const verifiedReports = product.reports.filter((r: any) => r.isVerified).length;
  score += Math.min(verifiedReports * 10, 30);

  // Pontos por informações completas (20 pontos máximo)
  let completenessScore = 0;
  if (product.description) completenessScore += 5;
  if (product.claims && Object.keys(product.claims).length > 0) completenessScore += 5;
  if (product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0) completenessScore += 5;
  if (product.imageUrl) completenessScore += 5;
  score += completenessScore;

  // Pontos por recência das validações (10 pontos máximo)
  if (validValidations > 0) {
    const latestValidation = product.validations[0];
    const daysSinceValidation = Math.floor(
      (Date.now() - new Date(latestValidation.validatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceValidation <= 30) score += 10;
    else if (daysSinceValidation <= 90) score += 7;
    else if (daysSinceValidation <= 180) score += 5;
    else if (daysSinceValidation <= 365) score += 3;
  }

  return Math.min(score, maxScore);
}

// Buscar produtos por categoria (API pública)
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        category: {
          contains: category,
          mode: 'insensitive'
        },
        status: 'ACTIVE',
        qrCode: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        validations: {
          where: {
            status: 'APPROVED'
          },
          take: 1,
          orderBy: {
            validatedAt: 'desc'
          }
        }
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response = {
      success: true,
      data: {
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          imageUrl: product.imageUrl,
          qrCode: product.qrCode,
          brand_info: {
            name: product.user.name
          },
          hasValidation: product.validations.length > 0,
          trustScore: calculateTrustScore(product)
        })),
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: products.length
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Estatísticas públicas da plataforma
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const [
      totalProducts,
      totalValidations,
      totalReports,
      totalBrands
    ] = await Promise.all([
      prisma.product.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.validation.count({
        where: { status: 'APPROVED' }
      }),
      prisma.report.count({
        where: { isVerified: true }
      }),
      prisma.user.count({
        where: { role: 'BRAND' }
      })
    ]);

    // Estatísticas por categoria
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      where: {
        status: 'ACTIVE',
        qrCode: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const response = {
      success: true,
      data: {
        overview: {
          totalProducts,
          totalValidations,
          totalReports,
          totalBrands
        },
        categories: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.id
        })),
        lastUpdated: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
