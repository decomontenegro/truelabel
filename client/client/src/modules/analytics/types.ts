/**
 * Analytics Module Types
 * 
 * Tipos para o módulo de analytics avançado do True Label
 */

// Base Analytics Types
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  data: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: GeoLocation;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country: string;
  region?: string;
}

// Dashboard Analytics
export interface DashboardMetrics {
  overview: OverviewMetrics;
  qrScans: QRScanMetrics;
  validations: ValidationMetrics;
  products: ProductMetrics;
  users: UserMetrics;
  revenue: RevenueMetrics;
}

export interface OverviewMetrics {
  totalProducts: number;
  totalValidations: number;
  totalQRScans: number;
  activeUsers: number;
  conversionRate: number;
  growthRate: number;
  trends: {
    products: TrendData[];
    validations: TrendData[];
    scans: TrendData[];
    users: TrendData[];
  };
}

export interface TrendData {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

// QR Code Analytics
export interface QRScanMetrics {
  totalScans: number;
  uniqueScans: number;
  scansByPeriod: PeriodData[];
  topProducts: TopProduct[];
  scansByLocation: LocationData[];
  scansByDevice: DeviceData[];
  scansByTime: TimeData[];
  conversionFunnel: FunnelData[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  brand: string;
  scans: number;
  uniqueScans: number;
  conversionRate: number;
  revenue?: number;
}

export interface LocationData {
  location: GeoLocation;
  scans: number;
  uniqueUsers: number;
  conversionRate: number;
}

export interface DeviceData {
  device: string;
  platform: string;
  scans: number;
  percentage: number;
}

export interface TimeData {
  hour: number;
  day: string;
  scans: number;
  avgSessionDuration: number;
}

// Validation Analytics
export interface ValidationMetrics {
  totalValidations: number;
  approvedValidations: number;
  rejectedValidations: number;
  pendingValidations: number;
  averageProcessingTime: number;
  validationsByType: ValidationTypeData[];
  validationsByLab: LabValidationData[];
  validationTrends: TrendData[];
  accuracyMetrics: AccuracyMetrics;
}

export interface ValidationTypeData {
  type: string;
  count: number;
  approvalRate: number;
  avgProcessingTime: number;
}

export interface LabValidationData {
  laboratoryId: string;
  laboratoryName: string;
  validations: number;
  approvalRate: number;
  avgProcessingTime: number;
  rating: number;
}

export interface AccuracyMetrics {
  overallAccuracy: number;
  falsePositives: number;
  falseNegatives: number;
  precisionScore: number;
  recallScore: number;
}

// Product Analytics
export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  productsByCategory: CategoryData[];
  productsByBrand: BrandData[];
  productPerformance: ProductPerformanceData[];
  claimsAnalysis: ClaimsAnalysisData[];
}

export interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  avgValidationTime: number;
  approvalRate: number;
}

export interface BrandData {
  brand: string;
  products: number;
  validations: number;
  qrScans: number;
  revenue?: number;
}

export interface ProductPerformanceData {
  productId: string;
  productName: string;
  category: string;
  scans: number;
  validations: number;
  conversionRate: number;
  engagementScore: number;
  revenueImpact?: number;
}

export interface ClaimsAnalysisData {
  claim: string;
  frequency: number;
  approvalRate: number;
  avgValidationTime: number;
  popularityTrend: TrendData[];
}

// User Analytics
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: RoleData[];
  userEngagement: EngagementData[];
  userRetention: RetentionData[];
  userJourney: JourneyData[];
}

export interface RoleData {
  role: string;
  count: number;
  percentage: number;
  avgSessionDuration: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EngagementData {
  userId: string;
  userName: string;
  role: string;
  lastActive: string;
  sessionsCount: number;
  avgSessionDuration: number;
  actionsCount: number;
  engagementScore: number;
}

export interface RetentionData {
  period: string;
  newUsers: number;
  returningUsers: number;
  retentionRate: number;
  churnRate: number;
}

export interface JourneyData {
  step: string;
  users: number;
  completionRate: number;
  avgTimeToComplete: number;
  dropoffRate: number;
}

// Revenue Analytics
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  revenueByPlan: PlanRevenueData[];
  revenueByRegion: RegionRevenueData[];
  revenueTrends: TrendData[];
  churnAnalysis: ChurnAnalysisData;
}

export interface PlanRevenueData {
  plan: string;
  subscribers: number;
  revenue: number;
  percentage: number;
  churnRate: number;
}

export interface RegionRevenueData {
  region: string;
  revenue: number;
  customers: number;
  avgRevenuePerCustomer: number;
  growthRate: number;
}

export interface ChurnAnalysisData {
  churnRate: number;
  churnedUsers: number;
  churnReasons: ChurnReasonData[];
  churnPrediction: ChurnPredictionData[];
}

export interface ChurnReasonData {
  reason: string;
  count: number;
  percentage: number;
}

export interface ChurnPredictionData {
  userId: string;
  userName: string;
  churnProbability: number;
  riskFactors: string[];
  recommendedActions: string[];
}

// Filter and Query Types
export interface AnalyticsFilter {
  dateRange: {
    start: string;
    end: string;
  };
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
  userRole?: string[];
  productCategory?: string[];
  brand?: string[];
  location?: string[];
  device?: string[];
  validationType?: string[];
}

export interface PeriodData {
  period: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface FunnelData {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

// Real-time Analytics
export interface RealTimeMetrics {
  activeUsers: number;
  activeScans: number;
  recentEvents: RecentEvent[];
  liveMap: LiveMapData[];
  trending: TrendingItem[];
  alerts: AnalyticsAlert[];
}

export interface RecentEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  location?: GeoLocation;
}

export interface LiveMapData {
  location: GeoLocation;
  activeUsers: number;
  recentScans: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendingItem {
  type: 'product' | 'category' | 'location' | 'search';
  id: string;
  name: string;
  count: number;
  changePercent: number;
  rank: number;
}

export interface AnalyticsAlert {
  id: string;
  type: 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// Export and Report Types
export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  type: 'DASHBOARD' | 'QR_ANALYTICS' | 'VALIDATION_REPORT' | 'USER_REPORT';
  filters: AnalyticsFilter;
  data: any;
  generatedAt: string;
  generatedBy: string;
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
}

export interface ExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  sections: string[];
}
