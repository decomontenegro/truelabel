/**
 * Configuração de endpoints e fallbacks para desenvolvimento
 */

export const ENDPOINT_CONFIG = {
  // Endpoints que estão funcionando
  WORKING: {
    auth: true,
    products: true,
    qr: true,
    validations: true,
    validationQueue: true, // Now working!
    laboratories: true,
    reports: true,
    analytics: true,
    nutrition: true, // Now implemented!
  },
  
  // Endpoints que precisam de mock/fallback
  MOCK_FALLBACK: {
    validationMetrics: true,
    websockets: true,
    realTimeAnalytics: true,
  },
  
  // URLs base - usar configuração dinâmica baseada no ambiente
  API_BASE: typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? '/api'
    : 'http://localhost:9100/api',
  WS_BASE: typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? `wss://${window.location.host}`
    : 'ws://localhost:9100',
  
  // Configurações de desenvolvimento
  DEV_CONFIG: {
    enableMockData: true,
    enableWebSockets: false,
    enableRealTimeUpdates: false,
    logApiCalls: true,
  }
};

/**
 * Helper para verificar se um endpoint deve usar mock
 */
export const shouldUseMock = (endpoint: keyof typeof ENDPOINT_CONFIG.MOCK_FALLBACK): boolean => {
  return import.meta.env.DEV && ENDPOINT_CONFIG.MOCK_FALLBACK[endpoint];
};

/**
 * Helper para log de API calls em desenvolvimento
 */
export const logApiCall = (method: string, url: string, status?: number): void => {
  if (import.meta.env.DEV && ENDPOINT_CONFIG.DEV_CONFIG.logApiCalls) {
    const statusColor = status ? (status >= 200 && status < 300 ? '✅' : '❌') : '🔄';
    console.log(`${statusColor} API ${method.toUpperCase()} ${url}${status ? ` (${status})` : ''}`);
  }
};

/**
 * Mock data para desenvolvimento
 */
export const MOCK_DATA = {
  nutritionDailyValues: {
    BRAZIL: {
      energy: { value: 2000, unit: 'kcal' },
      protein: { value: 50, unit: 'g' },
      carbohydrates: { value: 300, unit: 'g' },
      fat: { value: 65, unit: 'g' },
      saturatedFat: { value: 20, unit: 'g' },
      fiber: { value: 25, unit: 'g' },
      sodium: { value: 2300, unit: 'mg' },
      sugars: { value: 50, unit: 'g' }
    }
  },
  
  validationQueue: [],
  
  validationMetrics: {
    totalValidations: 0,
    automatedPercentage: 0,
    averageProcessingTime: 0,
    successRate: 0,
    pendingValidations: 0,
    completedToday: 0
  },
  
  analyticsRealTime: {
    activeUsers: 0,
    qrScansToday: 0,
    validationsToday: 0,
    systemLoad: 0
  }
};

/**
 * Interceptor para adicionar logs e fallbacks
 */
export const createApiInterceptor = (api: any) => {
  // Request interceptor
  api.interceptors.request.use(
    (config: any) => {
      logApiCall(config.method || 'GET', config.url || '');
      return config;
    },
    (error: any) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response: any) => {
      logApiCall(
        response.config.method || 'GET',
        response.config.url || '',
        response.status
      );
      return response;
    },
    (error: any) => {
      const method = error.config?.method || 'GET';
      const url = error.config?.url || '';
      const status = error.response?.status;
      
      logApiCall(method, url, status);
      
      // Nutrition endpoint now works - no need for mock!
      
      // Validation queue now works - no need for mock!
      
      if (shouldUseMock('validationMetrics') && url.includes('/validations/metrics')) {
        console.warn('🔄 Using validation metrics mock data');
        return Promise.resolve({
          data: MOCK_DATA.validationMetrics,
          status: 200,
          statusText: 'OK (Mock)'
        });
      }
      
      return Promise.reject(error);
    }
  );
};
