/**
 * Fallback Service
 * 
 * Purpose: Provide fallback data when API endpoints are not available
 * This ensures the application continues to work even when backend is down
 */

import { Product, Validation, Certification } from '@/types';

// Mock data for fallback scenarios
export const fallbackData = {
  products: [
    {
      id: '1',
      name: 'Produto Orgânico Premium',
      brand: 'EcoLife',
      category: 'Alimentos',
      sku: 'ECO-001',
      status: 'VALIDATED',
      claims: 'Orgânico, Sem glúten, Rico em fibras',
      description: 'Produto orgânico certificado com alta qualidade nutricional',
      qrCode: 'QR001',
      imageUrl: '/images/product-placeholder.jpg',
      userId: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Suplemento Natural',
      brand: 'VitaHealth',
      category: 'Suplementos',
      sku: 'VIT-002',
      status: 'PENDING',
      claims: 'Natural, Vitamina C, Antioxidante',
      description: 'Suplemento natural rico em vitamina C',
      qrCode: 'QR002',
      imageUrl: '/images/product-placeholder.jpg',
      userId: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] as Product[],

  validations: [
    {
      id: '1',
      productId: '1',
      status: 'APPROVED',
      type: 'LABORATORY',
      claimsValidated: { 
        'Orgânico': { validated: true, notes: 'Certificado IBD' }, 
        'Sem glúten': { validated: true, notes: 'Teste laboratorial confirmado' } 
      },
      summary: 'Produto aprovado em todos os testes laboratoriais',
      notes: 'Análises microbiológicas e químicas dentro dos padrões',
      validatedAt: new Date().toISOString(),
      userId: '1',
      reportId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      productId: '2',
      status: 'PENDING',
      type: 'MANUAL',
      claimsValidated: {},
      summary: 'Aguardando análise laboratorial',
      notes: 'Documentação recebida, aguardando testes',
      validatedAt: null,
      userId: '1',
      reportId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] as Validation[],

  certifications: [
    {
      id: '1',
      name: 'Certificação Orgânica IBD',
      type: 'ORGANIC',
      issuingBody: 'IBD Certificações',
      status: 'ACTIVE',
      description: 'Certificação para produtos orgânicos',
      requirements: ['Produção sem agrotóxicos', 'Solo livre de contaminantes'],
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      documentUrl: '/docs/cert-organica.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'ISO 22000',
      type: 'ISO',
      issuingBody: 'Bureau Veritas',
      status: 'ACTIVE',
      description: 'Sistema de gestão de segurança de alimentos',
      requirements: ['HACCP implementado', 'Rastreabilidade completa'],
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      documentUrl: '/docs/iso-22000.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] as Certification[],

  analytics: {
    overview: {
      qrScans: {
        totalScans: 1250,
        uniqueScans: 980,
        scansByPeriod: [
          { date: '2024-01-01', scans: 45 },
          { date: '2024-01-02', scans: 52 },
          { date: '2024-01-03', scans: 38 },
          { date: '2024-01-04', scans: 61 },
          { date: '2024-01-05', scans: 44 }
        ],
        scansByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          scans: Math.floor(Math.random() * 50) + 10
        })),
        scansByWeekday: [
          { day: 'Dom', scans: 120 },
          { day: 'Seg', scans: 180 },
          { day: 'Ter', scans: 165 },
          { day: 'Qua', scans: 190 },
          { day: 'Qui', scans: 175 },
          { day: 'Sex', scans: 200 },
          { day: 'Sáb', scans: 140 }
        ]
      },
      demographics: {
        ageGroups: [
          { range: '18-25', percentage: 25 },
          { range: '26-35', percentage: 35 },
          { range: '36-45', percentage: 25 },
          { range: '46+', percentage: 15 }
        ],
        locations: [
          { city: 'São Paulo', percentage: 40 },
          { city: 'Rio de Janeiro', percentage: 25 },
          { city: 'Belo Horizonte', percentage: 15 },
          { city: 'Brasília', percentage: 10 },
          { city: 'Outros', percentage: 10 }
        ]
      },
      sectionEngagement: {
        validations: { views: 450, avgTime: 120 },
        certifications: { views: 320, avgTime: 90 },
        reports: { views: 280, avgTime: 150 },
        products: { views: 520, avgTime: 180 }
      },
      engagement: {
        totalViews: 1570,
        avgSessionTime: 180,
        bounceRate: 25,
        returnVisitors: 65
      },
      topProducts: [
        { id: '1', name: 'Produto Orgânico Premium', scans: 450 },
        { id: '2', name: 'Suplemento Natural', scans: 320 }
      ]
    },
    dashboard: {
      totalProducts: 2,
      totalValidations: 2,
      totalScans: 1250,
      conversionRate: 15.5,
      recentActivity: [
        { 
          type: 'scan', 
          description: 'QR Code do Produto Orgânico Premium escaneado', 
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() 
        },
        { 
          type: 'validation', 
          description: 'Produto Orgânico Premium validado com sucesso', 
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() 
        },
        { 
          type: 'certification', 
          description: 'Nova certificação orgânica adicionada', 
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() 
        }
      ]
    }
  },

  laboratories: [
    {
      id: '1',
      name: 'Laboratório Central de Análises',
      accreditation: 'ISO 17025',
      email: 'contato@labcentral.com',
      phone: '(11) 3456-7890',
      address: 'Rua das Análises, 123 - São Paulo, SP',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Instituto de Pesquisas Alimentares',
      accreditation: 'INMETRO',
      email: 'contato@ipa.org.br',
      phone: '(21) 2345-6789',
      address: 'Av. Pesquisa, 456 - Rio de Janeiro, RJ',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Fallback service functions
export const fallbackService = {
  // Check if we should use fallback data
  shouldUseFallback: (error: any): boolean => {
    // Use fallback if API is completely down (5xx errors) or network issues
    return !error.response || 
           error.response.status >= 500 || 
           error.code === 'NETWORK_ERROR' ||
           error.message.includes('Network Error');
  },

  // Get fallback message for users
  getFallbackMessage: (module: string): string => {
    return `Dados de ${module} carregados do cache local. Algumas funcionalidades podem estar limitadas.`;
  },

  // Simulate API delay for realistic UX
  async simulateDelay(ms: number = 500): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  // Format fallback response to match API structure
  formatResponse: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message: message || 'Dados carregados com sucesso',
    fallback: true
  }),

  // Format paginated response
  formatPaginatedResponse: <T>(data: T[], page: number = 1, limit: number = 10) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: Array.isArray(data) ? data.length : 0,
      totalPages: Array.isArray(data) ? Math.ceil(data.length / limit) : 0
    },
    fallback: true
  }),

  // Log fallback usage for monitoring
  logFallbackUsage: (service: string, endpoint: string, error?: any) => {
    console.warn(`🔄 Fallback activated for ${service}:${endpoint}`, {
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error',
      userAgent: navigator.userAgent
    });
  }
};

export default fallbackService;
