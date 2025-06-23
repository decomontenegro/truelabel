import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

// Certificações brasileiras comuns para produtos de consumo
export const BRAZILIAN_CERTIFICATIONS = {
  // Selos Regulatórios
  ANVISA: {
    name: 'ANVISA',
    fullName: 'Agência Nacional de Vigilância Sanitária',
    category: 'regulatory',
    description: 'Registro ou notificação na ANVISA',
    required: true,
    validator: /^[0-9]{13}$/, // Formato: 13 dígitos
  },
  INMETRO: {
    name: 'INMETRO',
    fullName: 'Instituto Nacional de Metrologia, Qualidade e Tecnologia',
    category: 'quality',
    description: 'Certificação de conformidade INMETRO',
    required: false,
    validator: /^[0-9]{6,}$/,
  },
  MAPA: {
    name: 'MAPA',
    fullName: 'Ministério da Agricultura, Pecuária e Abastecimento',
    category: 'regulatory',
    description: 'Registro no MAPA para produtos de origem animal/vegetal',
    required: false,
    validator: /^[A-Z]{2}[-]?[0-9]{4,}$/,
  },
  
  // Selos de Qualidade
  ISO_22000: {
    name: 'ISO 22000',
    fullName: 'Sistema de Gestão de Segurança de Alimentos',
    category: 'quality',
    description: 'Certificação ISO 22000',
    required: false,
  },
  HACCP: {
    name: 'HACCP',
    fullName: 'Hazard Analysis and Critical Control Points',
    category: 'quality',
    description: 'Análise de Perigos e Pontos Críticos de Controle',
    required: false,
  },
  BPF: {
    name: 'BPF',
    fullName: 'Boas Práticas de Fabricação',
    category: 'quality',
    description: 'Certificação de Boas Práticas de Fabricação',
    required: true,
  },
  
  // Selos Nutricionais
  ZERO_LACTOSE: {
    name: 'Zero Lactose',
    fullName: 'Produto Zero Lactose',
    category: 'nutritional',
    description: 'Produto isento de lactose',
    required: false,
  },
  SEM_GLUTEN: {
    name: 'Sem Glúten',
    fullName: 'Produto Sem Glúten',
    category: 'nutritional',
    description: 'Produto isento de glúten',
    required: false,
  },
  ORGANICO: {
    name: 'Orgânico Brasil',
    fullName: 'Produto Orgânico Brasil',
    category: 'nutritional',
    description: 'Certificação de produto orgânico',
    required: false,
  },
  VEGANO: {
    name: 'Produto Vegano',
    fullName: 'Certificação Vegana',
    category: 'nutritional',
    description: 'Produto vegano certificado',
    required: false,
  },
  
  // Selos Ambientais
  FSC: {
    name: 'FSC',
    fullName: 'Forest Stewardship Council',
    category: 'environmental',
    description: 'Certificação de manejo florestal sustentável',
    required: false,
  },
  EURECICLO: {
    name: 'eureciclo',
    fullName: 'Selo eureciclo',
    category: 'environmental',
    description: 'Compensação ambiental de embalagens',
    required: false,
  },
  CARBONO_NEUTRO: {
    name: 'Carbono Neutro',
    fullName: 'Produto Carbono Neutro',
    category: 'environmental',
    description: 'Compensação de emissões de carbono',
    required: false,
  },
  
  // Selos Sociais
  COMERCIO_JUSTO: {
    name: 'Comércio Justo',
    fullName: 'Fair Trade Brasil',
    category: 'social',
    description: 'Certificação de comércio justo',
    required: false,
  },
  EMPRESA_B: {
    name: 'Sistema B',
    fullName: 'Empresa B Certificada',
    category: 'social',
    description: 'Empresa com impacto social e ambiental positivo',
    required: false,
  },

  // Selos Religiosos
  HALAL: {
    name: 'Halal',
    fullName: 'Certificação Halal Brasil',
    category: 'religious',
    description: 'Produto permitido pela lei islâmica',
    required: false,
  },
  KOSHER: {
    name: 'Kosher',
    fullName: 'Certificação Kosher',
    category: 'religious',
    description: 'Produto permitido pela lei judaica',
    required: false,
  },
};

export type CertificationType = keyof typeof BRAZILIAN_CERTIFICATIONS;

export interface CertificationData {
  type: CertificationType;
  number: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  documentUrl?: string;
  verified: boolean;
}

export class CertificationService {
  // Validar certificação
  static async validateCertification(
    productId: string,
    certification: CertificationData
  ): Promise<boolean> {
    const certConfig = BRAZILIAN_CERTIFICATIONS[certification.type];
    
    if (!certConfig) {
      throw new AppError('Invalid certification type', 400);
    }

    // Validar formato do número se houver validator
    if (certConfig.validator && !certConfig.validator.test(certification.number)) {
      throw new AppError(`Invalid ${certConfig.name} number format`, 400);
    }

    // Verificar se já não expirou
    if (certification.expiresAt && new Date(certification.expiresAt) < new Date()) {
      throw new AppError('Certification has expired', 400);
    }

    // TODO: Implementar verificação real com APIs dos órgãos
    // Por enquanto, simular verificação
    const verified = await this.simulateVerification(certification);

    // Salvar certificação no banco
    await prisma.certification.create({
      data: {
        productId,
        type: certification.type,
        issuer: certification.issuer,
        number: certification.number,
        issuedAt: certification.issuedAt,
        expiresAt: certification.expiresAt,
        verified,
      },
    });

    logger.info(`Certification ${certification.type} validated for product ${productId}`);

    return verified;
  }

  // Simular verificação (substituir por integrações reais)
  private static async simulateVerification(certification: CertificationData): Promise<boolean> {
    // Simular delay de verificação
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular 95% de sucesso
    return Math.random() > 0.05;
  }

  // Obter certificações obrigatórias por categoria
  static getRequiredCertifications(productCategory: string): CertificationType[] {
    const required: CertificationType[] = [];

    // Mapear categorias de produtos para certificações obrigatórias
    const categoryMap: Record<string, CertificationType[]> = {
      'alimento': ['ANVISA', 'BPF'],
      'suplemento': ['ANVISA', 'BPF'],
      'bebida': ['ANVISA', 'BPF'],
      'cosmetico': ['ANVISA', 'BPF'],
      'medicamento': ['ANVISA', 'BPF'],
      'produto_animal': ['MAPA', 'BPF'],
      'produto_vegetal': ['MAPA'],
    };

    const certTypes = categoryMap[productCategory.toLowerCase()] || ['ANVISA', 'BPF'];
    
    return certTypes;
  }

  // Verificar conformidade de certificações
  static async checkCompliance(productId: string): Promise<{
    compliant: boolean;
    missing: CertificationType[];
    expired: CertificationType[];
    valid: CertificationType[];
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { certifications: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const requiredCerts = this.getRequiredCertifications(product.category);
    const productCerts = product.certifications;

    const missing: CertificationType[] = [];
    const expired: CertificationType[] = [];
    const valid: CertificationType[] = [];

    // Verificar certificações obrigatórias
    for (const certType of requiredCerts) {
      const cert = productCerts.find(c => c.type === certType);
      
      if (!cert) {
        missing.push(certType);
      } else if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) {
        expired.push(certType);
      } else if (cert.verified) {
        valid.push(certType);
      }
    }

    // Adicionar certificações opcionais válidas
    for (const cert of productCerts) {
      if (!requiredCerts.includes(cert.type as CertificationType) && 
          cert.verified && 
          (!cert.expiresAt || new Date(cert.expiresAt) > new Date())) {
        valid.push(cert.type as CertificationType);
      }
    }

    const compliant = missing.length === 0 && expired.length === 0;

    return {
      compliant,
      missing,
      expired,
      valid,
    };
  }

  // Gerar relatório de certificações
  static async generateCertificationReport(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        certifications: true,
        brand: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const compliance = await this.checkCompliance(productId);

    const report = {
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand.name,
      },
      compliance: {
        status: compliance.compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        percentage: Math.round((compliance.valid.length / 
          (compliance.valid.length + compliance.missing.length + compliance.expired.length)) * 100),
      },
      certifications: {
        valid: compliance.valid.map(type => ({
          ...BRAZILIAN_CERTIFICATIONS[type],
          type,
          details: product.certifications.find(c => c.type === type),
        })),
        missing: compliance.missing.map(type => ({
          ...BRAZILIAN_CERTIFICATIONS[type],
          type,
        })),
        expired: compliance.expired.map(type => ({
          ...BRAZILIAN_CERTIFICATIONS[type],
          type,
          details: product.certifications.find(c => c.type === type),
        })),
      },
      generatedAt: new Date(),
    };

    logger.info(`Certification report generated for product ${productId}`);

    return report;
  }

  // Alertas de expiração
  static async getExpiringCertifications(days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const expiring = await prisma.certification.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
          lte: expiryDate,
        },
        verified: true,
      },
      include: {
        product: {
          include: { brand: true },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return expiring.map(cert => ({
      id: cert.id,
      type: cert.type,
      number: cert.number,
      expiresAt: cert.expiresAt,
      daysUntilExpiry: Math.ceil(
        (cert.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      product: {
        id: cert.product.id,
        name: cert.product.name,
        brand: cert.product.brand.name,
      },
    }));
  }
}