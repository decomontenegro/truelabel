import { format, subDays } from 'date-fns';
import {
  AnalyticsOverview,
  QRScanMetrics,
  ConsumerDemographics,
  SectionEngagement,
  EngagementMetrics,
  AnalyticsFilters,
} from './analyticsService';
import {
  GeoHeatmapData,
  ProductPerformanceMetrics,
  ConsumerInsights,
  PredictiveInsights,
  RealTimeMetrics,
  ExportOptions,
  RealtimeAction,
  TrendingItem,
  Forecast,
  Anomaly,
  Recommendation,
  ConsumerSegment,
  ConsumerBehaviorPattern
} from '@/types/analytics';

// Generate mock data for testing
const generateMockData = (filters?: AnalyticsFilters): AnalyticsOverview => {
  const startDate = filters?.startDate ? new Date(filters.startDate) : subDays(new Date(), 30);
  const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

  // Generate scansByPeriod data
  const scansByPeriod = [];
  for (let i = 0; i < 30; i++) {
    const date = subDays(endDate, i);
    scansByPeriod.push({
      date: format(date, 'yyyy-MM-dd'),
      scans: Math.floor(Math.random() * 500) + 100,
    });
  }
  scansByPeriod.reverse();

  // Generate hourly data
  const scansByHour = [];
  for (let i = 0; i < 24; i++) {
    scansByHour.push({
      hour: i,
      scans: Math.floor(Math.random() * 200) + 20,
    });
  }

  // Generate weekday data
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const scansByWeekday = weekdays.map((day) => ({
    day,
    scans: Math.floor(Math.random() * 1000) + 200,
  }));

  const qrScans: QRScanMetrics = {
    totalScans: 15432,
    uniqueScans: 8765,
    scansByPeriod,
    scansByHour,
    scansByWeekday,
  };

  const demographics: ConsumerDemographics = {
    byCountry: [
      { country: 'Brasil', count: 5432, percentage: 62.1 },
      { country: 'Portugal', count: 1234, percentage: 14.1 },
      { country: 'Estados Unidos', count: 876, percentage: 10.0 },
      { country: 'Argentina', count: 543, percentage: 6.2 },
      { country: 'México', count: 321, percentage: 3.7 },
      { country: 'Espanha', count: 234, percentage: 2.7 },
      { country: 'Chile', count: 125, percentage: 1.4 },
    ],
    byCity: [
      { city: 'São Paulo', country: 'Brasil', count: 2345 },
      { city: 'Rio de Janeiro', country: 'Brasil', count: 1234 },
      { city: 'Lisboa', country: 'Portugal', count: 876 },
      { city: 'Porto', country: 'Portugal', count: 543 },
      { city: 'New York', country: 'Estados Unidos', count: 432 },
    ],
    byDevice: [
      { device: 'Mobile', count: 10234, percentage: 66.3 },
      { device: 'Desktop', count: 4567, percentage: 29.6 },
      { device: 'Tablet', count: 631, percentage: 4.1 },
    ],
    byBrowser: [
      { browser: 'Chrome', count: 7654, percentage: 49.6 },
      { browser: 'Safari', count: 4321, percentage: 28.0 },
      { browser: 'Firefox', count: 2345, percentage: 15.2 },
      { browser: 'Edge', count: 1112, percentage: 7.2 },
    ],
  };

  const sectionEngagement: SectionEngagement[] = [
    { sectionName: 'Informações do Produto', views: 15432, averageTime: 45, bounceRate: 0.12 },
    { sectionName: 'Análise Laboratorial', views: 12345, averageTime: 120, bounceRate: 0.08 },
    { sectionName: 'Certificações', views: 8765, averageTime: 90, bounceRate: 0.15 },
    { sectionName: 'Origem do Produto', views: 6543, averageTime: 60, bounceRate: 0.18 },
    { sectionName: 'Sustentabilidade', views: 4321, averageTime: 75, bounceRate: 0.22 },
  ];

  const engagement: EngagementMetrics = {
    averageSessionDuration: 185, // seconds
    bounceRate: 0.24,
    returnVisitorRate: 0.42,
    conversionRate: 0.08,
    pageViewsPerSession: 3.2,
  };

  const topProducts = [
    { productId: '1', productName: 'Produto Premium A', scans: 3456, uniqueVisitors: 2345 },
    { productId: '2', productName: 'Produto Elite B', scans: 2876, uniqueVisitors: 1987 },
    { productId: '3', productName: 'Produto Special C', scans: 2345, uniqueVisitors: 1654 },
    { productId: '4', productName: 'Produto Gold D', scans: 1987, uniqueVisitors: 1432 },
    { productId: '5', productName: 'Produto Silver E', scans: 1654, uniqueVisitors: 1234 },
  ];

  return {
    qrScans,
    demographics,
    sectionEngagement,
    engagement,
    topProducts,
  };
};

class MockAnalyticsService {
  async getAnalyticsOverview(filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
    // Simulate API delay with random variation for realism
    const delay = 300 + Math.random() * 400; // 300-700ms
    await new Promise((resolve) => setTimeout(resolve, delay));
    return generateMockData(filters);
  }

  async getQRScanMetrics(filters?: AnalyticsFilters): Promise<QRScanMetrics> {
    const data = generateMockData(filters);
    return data.qrScans;
  }

  async getConsumerDemographics(filters?: AnalyticsFilters): Promise<ConsumerDemographics> {
    const data = generateMockData(filters);
    return data.demographics;
  }

  async getSectionEngagement(filters?: AnalyticsFilters): Promise<SectionEngagement[]> {
    const data = generateMockData(filters);
    return data.sectionEngagement;
  }

  async getEngagementMetrics(filters?: AnalyticsFilters): Promise<EngagementMetrics> {
    const data = generateMockData(filters);
    return data.engagement;
  }

  async getGeographicAnalytics(filters?: AnalyticsFilters): Promise<GeoHeatmapData[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Generate mock geographic data
    const cities = [
      { lat: -23.5505, lng: -46.6333, city: 'São Paulo', state: 'SP', country: 'Brasil' },
      { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
      { lat: -19.9167, lng: -43.9345, city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
      { lat: -15.7801, lng: -47.9292, city: 'Brasília', state: 'DF', country: 'Brasil' },
      { lat: -30.0277, lng: -51.2287, city: 'Porto Alegre', state: 'RS', country: 'Brasil' },
      { lat: 38.7223, lng: -9.1393, city: 'Lisboa', country: 'Portugal' },
      { lat: 41.1579, lng: -8.6291, city: 'Porto', country: 'Portugal' },
      { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'NY', country: 'Estados Unidos' },
      { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina' },
      { lat: 19.4326, lng: -99.1332, city: 'Cidade do México', country: 'México' }
    ];

    return cities.map((location, index) => ({
      location,
      value: Math.floor(Math.random() * 1000) + 100,
      intensity: Math.random(),
      details: {
        totalScans: Math.floor(Math.random() * 5000) + 500,
        uniqueUsers: Math.floor(Math.random() * 3000) + 300,
        avgSessionDuration: Math.floor(Math.random() * 180) + 60
      }
    }));
  }

  async getProductPerformance(productId: string, filters?: AnalyticsFilters): Promise<ProductPerformanceMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const performanceScore = Math.random() * 40 + 60; // 60-100
    
    return {
      productId,
      productName: `Produto ${productId}`,
      sku: `SKU-${productId}`,
      performanceScore,
      healthScore: performanceScore > 80 ? 90 : performanceScore > 60 ? 70 : 50,
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          period: format(subDays(new Date(), 6 - i), 'dd/MM'),
          value: Math.floor(Math.random() * 200) + 50,
          changePercent: Math.random() * 20 - 10,
          changeDirection: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable'
        })),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          period: `Semana ${i + 1}`,
          value: Math.floor(Math.random() * 1000) + 200,
          changePercent: Math.random() * 30 - 15,
          changeDirection: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable'
        })),
        monthly: [],
        quarterly: [],
        predictions: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          predictedValue: Math.floor(Math.random() * 200) + 100,
          upperBound: Math.floor(Math.random() * 250) + 150,
          lowerBound: Math.floor(Math.random() * 100) + 50,
          confidence: Math.random() * 0.3 + 0.7
        }))
      },
      comparisons: {
        vsLastPeriod: Math.random() * 40 - 20,
        vsAverage: Math.random() * 30 - 15,
        vsCategoryAverage: Math.random() * 25 - 10,
        vsTopPerformer: Math.random() * -50 - 10,
        rank: Math.floor(Math.random() * 10) + 1,
        totalProducts: 50
      },
      alerts: performanceScore < 70 ? [
        {
          id: '1',
          type: 'warning',
          metric: 'Engagement Rate',
          message: 'Taxa de engajamento abaixo da média',
          timestamp: new Date(),
          threshold: 70,
          currentValue: performanceScore,
          recommendation: 'Considere atualizar o conteúdo do produto'
        }
      ] : []
    };
  }

  async getConsumerInsights(filters?: AnalyticsFilters): Promise<ConsumerInsights> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const segments: ConsumerSegment[] = [
      {
        id: '1',
        name: 'Consumidores Conscientes',
        size: 3456,
        growthRate: 15.2,
        characteristics: ['Valorizam sustentabilidade', 'Verificam origem', 'Alta frequência de compra'],
        value: 8.5
      },
      {
        id: '2',
        name: 'Compradores Premium',
        size: 2134,
        growthRate: 8.7,
        characteristics: ['Alto poder aquisitivo', 'Buscam qualidade', 'Menos sensíveis a preço'],
        value: 9.2
      },
      {
        id: '3',
        name: 'Millennials Digitais',
        size: 4567,
        growthRate: 22.1,
        characteristics: ['Nativos digitais', 'Compartilham experiências', 'Valorizam conveniência'],
        value: 7.8
      }
    ];

    const behaviors: ConsumerBehaviorPattern[] = [
      {
        pattern: 'Verificação completa de informações',
        frequency: 0.67,
        users: 5432,
        impact: 'Alta conversão para compra',
        trend: 'emerging'
      },
      {
        pattern: 'Comparação entre produtos',
        frequency: 0.45,
        users: 3654,
        impact: 'Maior tempo de decisão',
        trend: 'stable'
      },
      {
        pattern: 'Compartilhamento social',
        frequency: 0.23,
        users: 1865,
        impact: 'Aumento do alcance orgânico',
        trend: 'emerging'
      }
    ];

    return {
      segments,
      behaviors,
      preferences: {
        topSections: [
          { section: 'Informações Nutricionais', percentage: 78.5 },
          { section: 'Certificações', percentage: 65.3 },
          { section: 'Origem do Produto', percentage: 54.2 },
          { section: 'Sustentabilidade', percentage: 42.1 }
        ],
        topProducts: [
          { productId: '1', productName: 'Produto Premium A', percentage: 18.5 },
          { productId: '2', productName: 'Produto Elite B', percentage: 15.3 },
          { productId: '3', productName: 'Produto Special C', percentage: 12.8 }
        ],
        peakHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          percentage: hour >= 18 && hour <= 21 ? Math.random() * 5 + 10 : Math.random() * 3 + 1
        })),
        deviceDistribution: [
          { device: 'Mobile', percentage: 67.2 },
          { device: 'Desktop', percentage: 28.5 },
          { device: 'Tablet', percentage: 4.3 }
        ]
      },
      loyaltyMetrics: {
        returnRate: 0.42,
        frequencyDistribution: [
          { visits: 1, users: 4532 },
          { visits: 2, users: 2341 },
          { visits: 3, users: 1234 },
          { visits: 4, users: 876 },
          { visits: 5, users: 543 }
        ],
        lifetimeValue: 285.50,
        churnRate: 0.18,
        nps: 72
      }
    };
  }

  async getPredictiveInsights(filters?: AnalyticsFilters): Promise<PredictiveInsights> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const forecasts: Forecast[] = [
      {
        metric: 'Total de Escaneamentos',
        period: 'daily',
        confidence: 0.85,
        methodology: 'ARIMA + Sazonalidade',
        predictions: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          predictedValue: Math.floor(Math.random() * 200) + 400,
          upperBound: Math.floor(Math.random() * 250) + 450,
          lowerBound: Math.floor(Math.random() * 150) + 350,
          confidence: 0.85 - (i * 0.05)
        }))
      }
    ];

    const anomalies: Anomaly[] = [
      {
        id: '1',
        type: 'spike',
        metric: 'Escaneamentos por hora',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        severity: 'medium',
        description: 'Aumento anormal de 250% nos escaneamentos',
        affectedProducts: ['1', '2'],
        possibleCauses: ['Campanha de marketing', 'Menção em mídia social'],
        suggestedActions: ['Verificar capacidade do servidor', 'Preparar estoque adicional']
      }
    ];

    const recommendations: Recommendation[] = [
      {
        id: '1',
        category: 'engagement',
        priority: 'high',
        title: 'Otimizar horário de postagens',
        description: 'Baseado nos padrões de acesso, recomendamos concentrar comunicações entre 18h e 21h',
        impact: {
          metric: 'Engajamento',
          expectedImprovement: 23,
          confidence: 0.78
        },
        implementation: {
          difficulty: 'easy',
          timeRequired: '1-2 dias',
          resources: ['Marketing', 'Social Media']
        }
      },
      {
        id: '2',
        category: 'performance',
        priority: 'medium',
        title: 'Implementar cache para imagens',
        description: 'Reduzir tempo de carregamento em dispositivos móveis',
        impact: {
          metric: 'Taxa de Rejeição',
          expectedImprovement: -15,
          confidence: 0.82
        },
        implementation: {
          difficulty: 'medium',
          timeRequired: '3-5 dias',
          resources: ['Desenvolvimento', 'Infraestrutura']
        }
      }
    ];

    return {
      forecasts,
      anomalies,
      recommendations,
      riskAssessment: {
        overallRisk: 'low',
        riskFactors: [
          {
            factor: 'Dependência de dispositivos móveis',
            probability: 0.7,
            impact: 0.6,
            score: 0.42,
            trend: 'increasing'
          },
          {
            factor: 'Concentração geográfica',
            probability: 0.5,
            impact: 0.4,
            score: 0.20,
            trend: 'stable'
          }
        ],
        mitigationStrategies: [
          'Diversificar canais de comunicação',
          'Expandir para novos mercados geográficos'
        ]
      },
      opportunityAnalysis: {
        opportunities: [
          {
            id: '1',
            type: 'market',
            title: 'Expansão para região Sul',
            description: 'Baixa penetração atual com alto potencial de crescimento',
            potentialValue: 150000,
            timeframe: '6 meses',
            requirements: ['Parcerias locais', 'Campanha regional']
          }
        ],
        marketTrends: [
          'Crescimento do consumo consciente',
          'Aumento da demanda por transparência'
        ],
        competitiveAdvantages: [
          'Pioneirismo em rastreabilidade',
          'Alta taxa de satisfação do consumidor'
        ]
      }
    };
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const activeUsers = Math.floor(Math.random() * 50) + 10;
    const products = ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E'];

    const recentActions: RealtimeAction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `action-${i}`,
      action: ['scan', 'view', 'share'][Math.floor(Math.random() * 3)],
      productId: `${Math.floor(Math.random() * 5) + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      sessionId: `session-${Math.floor(Math.random() * activeUsers)}`,
      location: {
        lat: -23.5505 + (Math.random() - 0.5) * 2,
        lng: -46.6333 + (Math.random() - 0.5) * 2,
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil'
      }
    }));

    const trending: TrendingItem[] = products.slice(0, 3).map((name, i) => ({
      type: 'product',
      id: `${i + 1}`,
      name,
      count: Math.floor(Math.random() * 100) + 50,
      changePercent: Math.random() * 40 - 20,
      rank: i + 1
    }));

    return {
      activeUsers,
      activeScans: Math.floor(activeUsers * 0.6),
      recentActions,
      liveMap: [
        {
          location: {
            lat: -23.5505,
            lng: -46.6333,
            city: 'São Paulo',
            country: 'Brasil'
          },
          activeUsers: Math.floor(activeUsers * 0.4),
          recentScans: Math.floor(activeUsers * 0.3),
          trend: 'increasing'
        }
      ],
      trending,
      alerts: []
    };
  }

  async exportAnalyticsReport(format: 'pdf' | 'excel' | 'csv', filters?: AnalyticsFilters): Promise<Blob> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Create a mock blob with some content
    const content = `Mock ${format.toUpperCase()} Report\nGenerated: ${new Date().toISOString()}\nFilters: ${JSON.stringify(filters, null, 2)}`;
    return new Blob([content], { type: 'text/plain' });
  }

  async exportCustomReport(options: ExportOptions): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const content = `Custom ${options.format.toUpperCase()} Report\nGenerated: ${new Date().toISOString()}\nSections: ${options.sections.map(s => s.name).join(', ')}`;
    return new Blob([content], { type: 'text/plain' });
  }

  downloadReport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new MockAnalyticsService();