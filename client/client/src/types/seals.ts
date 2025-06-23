export interface Seal {
  id: string;
  name: string;
  purpose: string;
  category: 'REGULATORY' | 'QUALITY' | 'ORGANIC' | 'ETHICAL' | 'ENVIRONMENTAL';
  isRequired: boolean;
  validatingEntity: string;
  description: string;
  verificationCriteria: string[];
  documentationRequired: string[];
  validityPeriod?: number; // em meses
  renewalRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSeal {
  id: string;
  productId: string;
  sealId: string;
  seal: Seal;
  certificateNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  validatingLaboratory?: string;
  documentUrl?: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'INVALID';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SealValidation {
  id: string;
  productSealId: string;
  validatorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  validationDate: string;
  notes?: string;
  evidenceUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SealCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Dados dos selos brasileiros
export const BRAZILIAN_SEALS: Omit<Seal, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // REGULATÓRIOS
  {
    name: 'ANVISA – Registro / Autorização',
    purpose: 'Obrigatório para suplementos',
    category: 'REGULATORY',
    isRequired: true,
    validatingEntity: 'ANVISA',
    description: 'Todo suplemento precisa de aprovação da ANVISA para ser comercializado no Brasil',
    verificationCriteria: [
      'Número de registro válido',
      'Produto cadastrado no sistema ANVISA',
      'Empresa regularizada'
    ],
    documentationRequired: [
      'Número de registro ANVISA',
      'Certificado de registro',
      'Comprovante de pagamento de taxa'
    ],
    validityPeriod: 60,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'SIF (Serviço de Inspeção Federal)',
    purpose: 'Controle sanitário de produtos de origem animal',
    category: 'REGULATORY',
    isRequired: true,
    validatingEntity: 'MAPA',
    description: 'Exigido para carnes, leites e derivados',
    verificationCriteria: [
      'Número SIF válido',
      'Estabelecimento registrado',
      'Inspeção sanitária em dia'
    ],
    documentationRequired: [
      'Número SIF',
      'Certificado de inspeção',
      'Relatório sanitário'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },

  // QUALIDADE
  {
    name: 'ISO 22000',
    purpose: 'Gestão de segurança de alimentos',
    category: 'QUALITY',
    isRequired: false,
    validatingEntity: 'Organismos Certificadores Acreditados',
    description: 'Norma internacional para toda a cadeia alimentar',
    verificationCriteria: [
      'Certificado válido',
      'Auditoria em dia',
      'Sistema implementado'
    ],
    documentationRequired: [
      'Certificado ISO 22000',
      'Relatório de auditoria',
      'Manual do sistema'
    ],
    validityPeriod: 36,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'HACCP (APPCC)',
    purpose: 'Análise de Perigos e Pontos Críticos de Controle',
    category: 'QUALITY',
    isRequired: false,
    validatingEntity: 'Organismos Certificadores',
    description: 'Sistema preventivo de controle de segurança alimentar',
    verificationCriteria: [
      'Plano HACCP implementado',
      'Pontos críticos identificados',
      'Monitoramento ativo'
    ],
    documentationRequired: [
      'Plano HACCP',
      'Registros de monitoramento',
      'Certificado de implementação'
    ],
    validityPeriod: 24,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'GMP (Boas Práticas de Fabricação)',
    purpose: 'Certificação internacional de boas práticas na indústria',
    category: 'QUALITY',
    isRequired: false,
    validatingEntity: 'Organismos Certificadores Internacionais',
    description: 'Muito usada na fabricação de suplementos esportivos',
    verificationCriteria: [
      'Instalações adequadas',
      'Processos documentados',
      'Controle de qualidade'
    ],
    documentationRequired: [
      'Certificado GMP',
      'Manual de procedimentos',
      'Relatório de auditoria'
    ],
    validityPeriod: 24,
    renewalRequired: true,
    isActive: true
  },

  // ORGÂNICOS
  {
    name: 'Orgânico Brasil (MAPA)',
    purpose: 'Certifica alimentos e ingredientes 100% orgânicos',
    category: 'ORGANIC',
    isRequired: true,
    validatingEntity: 'MAPA',
    description: 'Selo obrigatório para usar o termo "orgânico"',
    verificationCriteria: [
      'Produção orgânica certificada',
      'Ausência de agrotóxicos',
      'Rastreabilidade completa'
    ],
    documentationRequired: [
      'Certificado orgânico MAPA',
      'Plano de manejo orgânico',
      'Relatório de inspeção'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'IBD Orgânico',
    purpose: 'Certificação nacional e internacional de produtos orgânicos',
    category: 'ORGANIC',
    isRequired: false,
    validatingEntity: 'IBD Certificações',
    description: 'Valorizado no setor de suplementos naturais',
    verificationCriteria: [
      'Certificação IBD válida',
      'Produção orgânica verificada',
      'Cadeia de custódia'
    ],
    documentationRequired: [
      'Certificado IBD',
      'Relatório de inspeção',
      'Plano de produção orgânica'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'Ecocert',
    purpose: 'Certificação internacional de ingredientes naturais e orgânicos',
    category: 'ORGANIC',
    isRequired: false,
    validatingEntity: 'Ecocert Brasil',
    description: 'Ampla aceitação na UE e EUA',
    verificationCriteria: [
      'Padrões Ecocert atendidos',
      'Ingredientes naturais/orgânicos',
      'Processo sustentável'
    ],
    documentationRequired: [
      'Certificado Ecocert',
      'Lista de ingredientes',
      'Relatório de conformidade'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },

  // ÉTICOS
  {
    name: 'Selo Vegano (SVB)',
    purpose: 'Garante ausência de ingredientes de origem animal e testes em animais',
    category: 'ETHICAL',
    isRequired: false,
    validatingEntity: 'Sociedade Vegetariana Brasileira',
    description: 'Muito usado em suplementos à base de plantas',
    verificationCriteria: [
      'Ausência de ingredientes animais',
      'Não testado em animais',
      'Processo vegano'
    ],
    documentationRequired: [
      'Certificado SVB',
      'Lista de ingredientes',
      'Declaração de não teste em animais'
    ],
    validityPeriod: 24,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'PETA Cruelty-Free',
    purpose: 'Produto não testado em animais',
    category: 'ETHICAL',
    isRequired: false,
    validatingEntity: 'PETA',
    description: 'Relevante para marcas éticas',
    verificationCriteria: [
      'Política anti-teste animal',
      'Fornecedores certificados',
      'Compromisso assinado'
    ],
    documentationRequired: [
      'Certificado PETA',
      'Política da empresa',
      'Declaração de fornecedores'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'Fair Trade / Comércio Justo',
    purpose: 'Condições dignas para produtores',
    category: 'ETHICAL',
    isRequired: false,
    validatingEntity: 'Fairtrade International',
    description: 'Relevante em ingredientes como cacau, café, etc',
    verificationCriteria: [
      'Preço justo aos produtores',
      'Condições de trabalho dignas',
      'Desenvolvimento comunitário'
    ],
    documentationRequired: [
      'Certificado Fair Trade',
      'Relatório de impacto social',
      'Auditoria de fornecedores'
    ],
    validityPeriod: 36,
    renewalRequired: true,
    isActive: true
  },

  // AMBIENTAIS
  {
    name: 'Eureciclo',
    purpose: 'Logística reversa de embalagens',
    category: 'ENVIRONMENTAL',
    isRequired: false,
    validatingEntity: 'Eureciclo',
    description: 'Muito usado por marcas preocupadas com o meio ambiente',
    verificationCriteria: [
      'Compensação ambiental',
      'Logística reversa ativa',
      'Relatório de impacto'
    ],
    documentationRequired: [
      'Certificado Eureciclo',
      'Relatório de compensação',
      'Plano de logística reversa'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  },
  {
    name: 'Carbon Free / Carbono Neutro',
    purpose: 'Compensação das emissões de CO2',
    category: 'ENVIRONMENTAL',
    isRequired: false,
    validatingEntity: 'Organismos Certificadores Ambientais',
    description: 'Selo de responsabilidade ambiental',
    verificationCriteria: [
      'Inventário de carbono',
      'Compensação verificada',
      'Redução de emissões'
    ],
    documentationRequired: [
      'Certificado carbono neutro',
      'Inventário de emissões',
      'Comprovantes de compensação'
    ],
    validityPeriod: 12,
    renewalRequired: true,
    isActive: true
  }
];

export const SEAL_CATEGORIES: SealCategory[] = [
  {
    id: 'REGULATORY',
    name: 'Regulatórios',
    description: 'Selos obrigatórios exigidos por órgãos governamentais',
    color: 'red',
    icon: 'Shield'
  },
  {
    id: 'QUALITY',
    name: 'Qualidade',
    description: 'Certificações de qualidade e segurança',
    color: 'blue',
    icon: 'Award'
  },
  {
    id: 'ORGANIC',
    name: 'Orgânicos',
    description: 'Certificações de produtos orgânicos e naturais',
    color: 'green',
    icon: 'Leaf'
  },
  {
    id: 'ETHICAL',
    name: 'Éticos',
    description: 'Selos de responsabilidade ética e social',
    color: 'purple',
    icon: 'Heart'
  },
  {
    id: 'ENVIRONMENTAL',
    name: 'Ambientais',
    description: 'Certificações de sustentabilidade ambiental',
    color: 'emerald',
    icon: 'TreePine'
  }
];
