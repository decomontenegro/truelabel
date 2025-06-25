/**
 * Analytics Module Exports
 * 
 * Ponto central de exportação do módulo de analytics
 */

// Types
export type {
  AnalyticsEvent,
  AnalyticsFilter,
  DashboardMetrics,
  OverviewMetrics,
  QRScanMetrics,
  ValidationMetrics,
  ProductMetrics,
  UserMetrics,
  RevenueMetrics,
  RealTimeMetrics,
  TrendData,
  PeriodData,
  TopProduct,
  LocationData,
  DeviceData,
  TimeData,
  ValidationTypeData,
  LabValidationData,
  AccuracyMetrics,
  CategoryData,
  BrandData,
  ProductPerformanceData,
  ClaimsAnalysisData,
  RoleData,
  EngagementData,
  RetentionData,
  JourneyData,
  PlanRevenueData,
  RegionRevenueData,
  ChurnAnalysisData,
  ChurnReasonData,
  ChurnPredictionData,
  FunnelData,
  RecentEvent,
  LiveMapData,
  TrendingItem,
  AnalyticsAlert,
  AnalyticsReport,
  ExportOptions,
  GeoLocation
} from './types';

// Hooks
export {
  useDashboardAnalytics,
  useQRAnalytics,
  useValidationAnalytics,
  useProductAnalytics,
  useUserAnalytics,
  useRevenueAnalytics,
  useRealTimeAnalytics,
  useAnalyticsFilters,
  useAnalyticsExport,
  useAnalyticsComparison,
  useAnalyticsTracking,
  ANALYTICS_QUERY_KEYS
} from './hooks/useAnalytics';

// Services
export { analyticsService } from './services/analyticsService';

// Components
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export { MetricCard } from './components/MetricCard';
export { AnalyticsChart } from './components/AnalyticsChart';

// Utils
export { analyticsUtils } from './utils/analyticsUtils';

// Constants
export const ANALYTICS_EVENT_TYPES = {
  QR_SCAN: 'QR_SCAN',
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  VALIDATION_REQUEST: 'VALIDATION_REQUEST',
  VALIDATION_COMPLETE: 'VALIDATION_COMPLETE',
  REPORT_UPLOAD: 'REPORT_UPLOAD',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  QR_GENERATE: 'QR_GENERATE',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  SUBSCRIPTION_START: 'SUBSCRIPTION_START',
  SUBSCRIPTION_CANCEL: 'SUBSCRIPTION_CANCEL',
} as const;

export const ANALYTICS_ENTITY_TYPES = {
  PRODUCT: 'PRODUCT',
  USER: 'USER',
  QR_CODE: 'QR_CODE',
  VALIDATION: 'VALIDATION',
  REPORT: 'REPORT',
  LABORATORY: 'LABORATORY',
  PAYMENT: 'PAYMENT',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;

export const ANALYTICS_GRANULARITIES = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
} as const;

export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#8B5CF6',
  SECONDARY: '#6B7280',
} as const;
