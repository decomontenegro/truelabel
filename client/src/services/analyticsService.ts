import api from './api';
import mockAnalyticsService from './mockAnalyticsService';
import { 
  EnhancedAnalyticsOverview,
  GeoHeatmapData,
  ProductPerformanceMetrics,
  ConsumerInsights,
  PredictiveInsights,
  RealTimeMetrics,
  ExportOptions,
  AnalyticsWebSocketEvent,
  WebSocketConfig
} from '@/types/analytics';

// Use mock service when API endpoints are not available (smart fallback)
const USE_MOCK = true; // Always use mock for analytics until API is fully implemented

export interface QRScanMetrics {
  totalScans: number;
  uniqueScans: number;
  scansByPeriod: {
    date: string;
    scans: number;
  }[];
  scansByHour: {
    hour: number;
    scans: number;
  }[];
  scansByWeekday: {
    day: string;
    scans: number;
  }[];
}

export interface ConsumerDemographics {
  byCountry: {
    country: string;
    count: number;
    percentage: number;
  }[];
  byCity: {
    city: string;
    country: string;
    count: number;
  }[];
  byDevice: {
    device: string;
    count: number;
    percentage: number;
  }[];
  byBrowser: {
    browser: string;
    count: number;
    percentage: number;
  }[];
}

export interface SectionEngagement {
  sectionName: string;
  views: number;
  averageTime: number;
  bounceRate: number;
}

export interface EngagementMetrics {
  averageSessionDuration: number;
  bounceRate: number;
  returnVisitorRate: number;
  conversionRate: number;
  pageViewsPerSession: number;
}

export interface AnalyticsOverview {
  qrScans: QRScanMetrics;
  demographics: ConsumerDemographics;
  sectionEngagement: SectionEngagement[];
  engagement: EngagementMetrics;
  topProducts: {
    productId: string;
    productName: string;
    scans: number;
    uniqueVisitors: number;
  }[];
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  country?: string;
  device?: string;
}

class AnalyticsService {
  private wsConnection: WebSocket | null = null;
  private wsConfig: WebSocketConfig = {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  };
  private reconnectAttempts = 0;
  private eventListeners: Map<string, Function[]> = new Map();

  async getAnalyticsOverview(filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
    if (USE_MOCK) {
      return mockAnalyticsService.getAnalyticsOverview(filters);
    }
    
    const params = this.buildQueryParams(filters);
    const response = await api.get<AnalyticsOverview>(`/analytics/overview?${params}`);
    return response.data;
  }

  async getEnhancedAnalytics(filters?: AnalyticsFilters): Promise<EnhancedAnalyticsOverview> {
    if (USE_MOCK) {
      // For now, combine existing data with enhanced mock data
      const basicOverview = await mockAnalyticsService.getAnalyticsOverview(filters);
      return this.enhanceAnalyticsData(basicOverview, filters);
    }

    const params = this.buildQueryParams(filters);
    const response = await api.get<EnhancedAnalyticsOverview>(`/analytics/enhanced?${params}`);
    return response.data;
  }

  async getGeographicAnalytics(filters?: AnalyticsFilters): Promise<GeoHeatmapData[]> {
    if (USE_MOCK) {
      return mockAnalyticsService.getGeographicAnalytics(filters);
    }

    const params = this.buildQueryParams(filters);
    const response = await api.get<GeoHeatmapData[]>(`/analytics/geographic?${params}`);
    return response.data;
  }

  async getProductPerformance(productId: string, filters?: AnalyticsFilters): Promise<ProductPerformanceMetrics> {
    if (USE_MOCK) {
      return mockAnalyticsService.getProductPerformance(productId, filters);
    }

    const params = this.buildQueryParams(filters);
    const response = await api.get<ProductPerformanceMetrics>(`/analytics/products/${productId}/performance?${params}`);
    return response.data;
  }

  async getConsumerInsights(filters?: AnalyticsFilters): Promise<ConsumerInsights> {
    if (USE_MOCK) {
      return mockAnalyticsService.getConsumerInsights(filters);
    }

    const params = this.buildQueryParams(filters);
    const response = await api.get<ConsumerInsights>(`/analytics/consumer-insights?${params}`);
    return response.data;
  }

  async getPredictiveInsights(filters?: AnalyticsFilters): Promise<PredictiveInsights> {
    if (USE_MOCK) {
      return mockAnalyticsService.getPredictiveInsights(filters);
    }

    const params = this.buildQueryParams(filters);
    const response = await api.get<PredictiveInsights>(`/analytics/predictive?${params}`);
    return response.data;
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    if (USE_MOCK) {
      return mockAnalyticsService.getRealTimeMetrics();
    }

    const response = await api.get<RealTimeMetrics>('/analytics/realtime');
    return response.data;
  }

  // WebSocket connection for real-time updates (disabled when API not available)
  connectWebSocket(onMessage: (event: AnalyticsWebSocketEvent) => void): void {
    // Disable WebSocket when using mock services to avoid connection errors
    if (USE_MOCK) {
      console.log('WebSocket disabled - using mock analytics service');
      return;
    }

    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.wsConnection = new WebSocket(`${this.wsConfig.url}/analytics/ws`);

      this.wsConnection.onopen = () => {
        console.log('Analytics WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data: AnalyticsWebSocketEvent = JSON.parse(event.data);
          onMessage(data);
          this.notifyListeners(data.type, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect(onMessage);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.handleReconnect(onMessage);
    }
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.eventListeners.clear();
  }

  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  private handleReconnect(onMessage: (event: AnalyticsWebSocketEvent) => void): void {
    // Disable reconnection when using mock services
    if (USE_MOCK) {
      return;
    }

    if (this.reconnectAttempts < this.wsConfig.maxReconnectAttempts!) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.wsConfig.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connectWebSocket(onMessage);
      }, this.wsConfig.reconnectInterval);
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.wsConfig.heartbeatInterval);
  }

  private buildQueryParams(filters?: AnalyticsFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return params;
  }

  private enhanceAnalyticsData(basic: AnalyticsOverview, filters?: AnalyticsFilters): EnhancedAnalyticsOverview {
    // Transform basic analytics data to enhanced format
    return {
      summary: {
        totalScans: basic.qrScans.totalScans,
        uniqueUsers: basic.qrScans.uniqueScans,
        engagementRate: 1 - basic.engagement.bounceRate,
        conversionRate: basic.engagement.conversionRate,
        averageSessionDuration: basic.engagement.averageSessionDuration,
        topMetrics: [
          {
            name: 'Taxa de Retorno',
            value: basic.engagement.returnVisitorRate * 100,
            change: 12.5,
            trend: 'up',
            sparkline: [45, 52, 48, 65, 72, 68, 75]
          },
          {
            name: 'Tempo Médio',
            value: basic.engagement.averageSessionDuration,
            change: -5.2,
            trend: 'down',
            sparkline: [120, 118, 125, 115, 110, 108, 114]
          }
        ],
        keyInsights: [
          'Aumento de 15% no engajamento móvel',
          'Pico de acessos entre 18h e 20h',
          'Brasil representa 62% dos acessos'
        ]
      },
      realtime: {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        activeScans: Math.floor(Math.random() * 30) + 5,
        recentActions: [],
        liveMap: [],
        trending: basic.topProducts.map((p, i) => ({
          type: 'product' as const,
          id: p.productId,
          name: p.productName,
          count: p.scans,
          changePercent: Math.random() * 20 - 10,
          rank: i + 1
        })),
        alerts: []
      },
      performance: [],
      geographic: [],
      consumer: {
        segments: [],
        behaviors: [],
        preferences: {
          topSections: basic.sectionEngagement.map(s => ({
            section: s.sectionName,
            percentage: (s.views / basic.qrScans.totalScans) * 100
          })),
          topProducts: basic.topProducts.map(p => ({
            productId: p.productId,
            productName: p.productName,
            percentage: (p.scans / basic.qrScans.totalScans) * 100
          })),
          peakHours: basic.qrScans.scansByHour.map(h => ({
            hour: h.hour,
            percentage: (h.scans / basic.qrScans.totalScans) * 100
          })),
          deviceDistribution: basic.demographics.byDevice.map(d => ({
            device: d.device,
            percentage: d.percentage
          }))
        },
        loyaltyMetrics: {
          returnRate: basic.engagement.returnVisitorRate,
          frequencyDistribution: [],
          lifetimeValue: 0,
          churnRate: 0,
          nps: 0
        }
      },
      predictive: {
        forecasts: [],
        anomalies: [],
        recommendations: [],
        riskAssessment: {
          overallRisk: 'low',
          riskFactors: [],
          mitigationStrategies: []
        },
        opportunityAnalysis: {
          opportunities: [],
          marketTrends: [],
          competitiveAdvantages: []
        }
      },
      comparisons: {
        currentPeriod: {
          start: new Date(filters?.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(filters?.endDate || Date.now()),
          metrics: {
            totalScans: basic.qrScans.totalScans,
            uniqueUsers: basic.qrScans.uniqueScans,
            engagementRate: 1 - basic.engagement.bounceRate,
            conversionRate: basic.engagement.conversionRate
          }
        },
        previousPeriod: {
          start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          metrics: {
            totalScans: Math.floor(basic.qrScans.totalScans * 0.85),
            uniqueUsers: Math.floor(basic.qrScans.uniqueScans * 0.82),
            engagementRate: (1 - basic.engagement.bounceRate) * 0.92,
            conversionRate: basic.engagement.conversionRate * 0.88
          }
        },
        changes: {}
      }
    };
  }

  async getQRScanMetrics(filters?: AnalyticsFilters): Promise<QRScanMetrics> {
    if (USE_MOCK) {
      return mockAnalyticsService.getQRScanMetrics(filters);
    }
    
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.productId) params.append('productId', filters.productId);

    const response = await api.get<QRScanMetrics>(`/analytics/qr-scans?${params}`);
    return response.data;
  }

  async getConsumerDemographics(filters?: AnalyticsFilters): Promise<ConsumerDemographics> {
    if (USE_MOCK) {
      return mockAnalyticsService.getConsumerDemographics(filters);
    }
    
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.productId) params.append('productId', filters.productId);

    const response = await api.get<ConsumerDemographics>(`/analytics/demographics?${params}`);
    return response.data;
  }

  async getSectionEngagement(filters?: AnalyticsFilters): Promise<SectionEngagement[]> {
    if (USE_MOCK) {
      return mockAnalyticsService.getSectionEngagement(filters);
    }
    
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.productId) params.append('productId', filters.productId);

    const response = await api.get<SectionEngagement[]>(`/analytics/sections?${params}`);
    return response.data;
  }

  async getEngagementMetrics(filters?: AnalyticsFilters): Promise<EngagementMetrics> {
    if (USE_MOCK) {
      return mockAnalyticsService.getEngagementMetrics(filters);
    }
    
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.productId) params.append('productId', filters.productId);

    const response = await api.get<EngagementMetrics>(`/analytics/engagement?${params}`);
    return response.data;
  }

  async exportAnalyticsReport(format: 'pdf' | 'excel' | 'csv', filters?: AnalyticsFilters): Promise<Blob> {
    if (USE_MOCK) {
      return mockAnalyticsService.exportAnalyticsReport(format, filters);
    }
    
    const params = this.buildQueryParams(filters);
    params.append('format', format);

    const response = await api.get(`/analytics/export?${params}`, {
      responseType: 'blob',
    });

    return response.data;
  }

  async exportCustomReport(options: ExportOptions): Promise<Blob> {
    if (USE_MOCK) {
      return mockAnalyticsService.exportCustomReport(options);
    }

    const response = await api.post('/analytics/export/custom', options, {
      responseType: 'blob',
    });

    return response.data;
  }

  async scheduleReport(schedule: ExportOptions['schedule']): Promise<{ id: string; message: string }> {
    if (USE_MOCK) {
      return { id: 'mock-schedule-id', message: 'Relatório agendado com sucesso' };
    }

    const response = await api.post('/analytics/export/schedule', schedule);
    return response.data;
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

  // Helper method to generate insights from data
  generateInsights(data: EnhancedAnalyticsOverview): string[] {
    const insights: string[] = [];

    // Engagement insights
    if (data.summary.engagementRate > 0.7) {
      insights.push('Alta taxa de engajamento indica forte interesse dos consumidores');
    }
    
    // Geographic insights
    if (data.geographic && data.geographic.length > 0) {
      const topLocation = data.geographic[0];
      insights.push(`${topLocation.location.city} é o principal mercado consumidor`);
    }

    // Time-based insights
    const peakHour = data.consumer.preferences.peakHours.reduce((prev, current) => 
      prev.percentage > current.percentage ? prev : current
    );
    insights.push(`Pico de acessos às ${peakHour.hour}h`);

    // Device insights
    const mobilePercentage = data.consumer.preferences.deviceDistribution
      .find(d => d.device === 'Mobile')?.percentage || 0;
    if (mobilePercentage > 60) {
      insights.push('Maioria dos acessos via dispositivos móveis - otimize para mobile');
    }

    return insights;
  }
}

export default new AnalyticsService();