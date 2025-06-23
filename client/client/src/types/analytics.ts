// Analytics Types for True Label Platform

// Geographic Types
export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country: string;
  region?: string;
}

export interface GeoHeatmapData {
  location: GeoLocation;
  value: number;
  intensity: number;
  details?: {
    totalScans: number;
    uniqueUsers: number;
    avgSessionDuration: number;
  };
}

// Consumer Behavior Types
export interface ConsumerBehavior {
  userId?: string;
  sessionId: string;
  actions: ConsumerAction[];
  journey: CustomerJourney;
  preferences: ConsumerPreferences;
  engagementScore: number;
}

export interface ConsumerAction {
  type: 'scan' | 'view' | 'click' | 'share' | 'download' | 'purchase';
  timestamp: Date;
  productId?: string;
  section?: string;
  details?: Record<string, any>;
}

export interface CustomerJourney {
  firstInteraction: Date;
  lastInteraction: Date;
  totalInteractions: number;
  averageTimeBetweenInteractions: number;
  conversionPoints: ConversionPoint[];
  abandonmentPoints: string[];
}

export interface ConversionPoint {
  action: string;
  timestamp: Date;
  value?: number;
}

export interface ConsumerPreferences {
  preferredSections: string[];
  preferredProducts: string[];
  preferredTimeOfDay: number; // hour 0-23
  preferredDayOfWeek: number; // 0-6
  devicePreference: 'mobile' | 'desktop' | 'tablet';
}

// Product Performance Types
export interface ProductPerformanceMetrics {
  productId: string;
  productName: string;
  sku: string;
  performanceScore: number;
  trends: PerformanceTrend;
  comparisons: ProductComparison;
  healthScore: number;
  alerts: PerformanceAlert[];
}

export interface PerformanceTrend {
  daily: TrendData[];
  weekly: TrendData[];
  monthly: TrendData[];
  quarterly: TrendData[];
  predictions: PredictionData[];
}

export interface TrendData {
  period: string;
  value: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'stable';
}

export interface ProductComparison {
  vsLastPeriod: number;
  vsAverage: number;
  vsCategoryAverage: number;
  vsTopPerformer: number;
  rank: number;
  totalProducts: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  metric: string;
  message: string;
  timestamp: Date;
  threshold?: number;
  currentValue: number;
  recommendation?: string;
}

// Predictive Analytics Types
export interface PredictiveInsights {
  forecasts: Forecast[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  opportunityAnalysis: OpportunityAnalysis;
}

export interface Forecast {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly';
  predictions: PredictionData[];
  confidence: number;
  methodology: string;
}

export interface PredictionData {
  date: Date;
  predictedValue: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'pattern' | 'outlier';
  metric: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedProducts?: string[];
  possibleCauses: string[];
  suggestedActions: string[];
}

export interface Recommendation {
  id: string;
  category: 'performance' | 'engagement' | 'content' | 'timing' | 'targeting';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: {
    metric: string;
    expectedImprovement: number;
    confidence: number;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeRequired: string;
    resources: string[];
  };
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: number;
  score: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface OpportunityAnalysis {
  opportunities: Opportunity[];
  marketTrends: string[];
  competitiveAdvantages: string[];
}

export interface Opportunity {
  id: string;
  type: 'market' | 'product' | 'engagement' | 'expansion';
  title: string;
  description: string;
  potentialValue: number;
  timeframe: string;
  requirements: string[];
}

// Real-time Analytics Types
export interface RealTimeMetrics {
  activeUsers: number;
  activeScans: number;
  recentActions: RealtimeAction[];
  liveMap: LiveMapData[];
  trending: TrendingItem[];
  alerts: RealtimeAlert[];
}

export interface RealtimeAction {
  id: string;
  action: string;
  userId?: string;
  productId: string;
  location?: GeoLocation;
  timestamp: Date;
  sessionId: string;
}

export interface LiveMapData {
  location: GeoLocation;
  activeUsers: number;
  recentScans: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendingItem {
  type: 'product' | 'section' | 'location' | 'search';
  id: string;
  name: string;
  count: number;
  changePercent: number;
  rank: number;
}

export interface RealtimeAlert {
  id: string;
  type: 'spike' | 'anomaly' | 'milestone' | 'system';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  auto: boolean;
}

// Export Report Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  sections: ExportSection[];
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: AnalyticsFilters;
  customization?: ReportCustomization;
  schedule?: ReportSchedule;
}

export interface ExportSection {
  id: string;
  name: string;
  included: boolean;
  charts?: string[];
  tables?: string[];
  metrics?: string[];
}

export interface ReportCustomization {
  branding: {
    logo?: string;
    colors?: string[];
    companyName: string;
  };
  layout: 'standard' | 'executive' | 'detailed';
  language: 'pt' | 'en' | 'es';
  includeRawData: boolean;
  includeCommentary: boolean;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm
  recipients: string[];
  format: ExportOptions['format'];
}

// Enhanced Analytics Filters
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  productIds?: string[];
  country?: string;
  countries?: string[];
  city?: string;
  cities?: string[];
  device?: string;
  devices?: string[];
  userSegment?: string;
  customSegments?: string[];
  comparisonPeriod?: 'previous' | 'year' | 'custom';
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}

// WebSocket Event Types
export interface AnalyticsWebSocketEvent {
  type: 'scan' | 'view' | 'action' | 'alert' | 'update';
  data: any;
  timestamp: Date;
  source?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// Aggregated Analytics Overview
export interface EnhancedAnalyticsOverview {
  summary: AnalyticsSummary;
  realtime: RealTimeMetrics;
  performance: ProductPerformanceMetrics[];
  geographic: GeoHeatmapData[];
  consumer: ConsumerInsights;
  predictive: PredictiveInsights;
  comparisons: PeriodComparison;
}

export interface AnalyticsSummary {
  totalScans: number;
  uniqueUsers: number;
  engagementRate: number;
  conversionRate: number;
  averageSessionDuration: number;
  topMetrics: TopMetric[];
  keyInsights: string[];
}

export interface TopMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sparkline?: number[];
}

export interface ConsumerInsights {
  segments: ConsumerSegment[];
  behaviors: ConsumerBehaviorPattern[];
  preferences: AggregatedPreferences;
  loyaltyMetrics: LoyaltyMetrics;
}

export interface ConsumerSegment {
  id: string;
  name: string;
  size: number;
  growthRate: number;
  characteristics: string[];
  value: number;
}

export interface ConsumerBehaviorPattern {
  pattern: string;
  frequency: number;
  users: number;
  impact: string;
  trend: 'emerging' | 'stable' | 'declining';
}

export interface AggregatedPreferences {
  topSections: { section: string; percentage: number }[];
  topProducts: { productId: string; productName: string; percentage: number }[];
  peakHours: { hour: number; percentage: number }[];
  deviceDistribution: { device: string; percentage: number }[];
}

export interface LoyaltyMetrics {
  returnRate: number;
  frequencyDistribution: { visits: number; users: number }[];
  lifetimeValue: number;
  churnRate: number;
  nps: number;
}

export interface PeriodComparison {
  currentPeriod: {
    start: Date;
    end: Date;
    metrics: Record<string, number>;
  };
  previousPeriod: {
    start: Date;
    end: Date;
    metrics: Record<string, number>;
  };
  changes: Record<string, {
    absolute: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  }>;
}