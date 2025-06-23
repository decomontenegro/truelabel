/**
 * Configuração centralizada do frontend
 * Gerencia variáveis de ambiente e configurações da aplicação
 */

import { env, isDevelopment, isProduction } from './env-validation';

interface Config {
  // API
  apiUrl: string;
  apiTimeout: number;
  
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Features
  features: {
    qrCodes: boolean;
    analytics: boolean;
    notifications: boolean;
    fileUpload: boolean;
  };
  
  // Upload
  upload: {
    maxSize: number; // em bytes
    allowedTypes: string[];
    maxFiles: number;
  };
  
  // UI
  ui: {
    toastDuration: number;
    debounceDelay: number;
    paginationSize: number;
  };
  
  // Cache
  cache: {
    qrCodeTtl: number; // em ms
    userDataTtl: number; // em ms
  };
  
  // External Services
  external: {
    qrApiUrl?: string;
    analyticsId?: string;
  };
}

/**
 * Configuração padrão
 */
const defaultConfig: Config = {
  // API
  apiUrl: '/api',
  apiTimeout: 30000, // 30 segundos

  // Environment
  isDevelopment: false,
  isProduction: true,
  
  // Features
  features: {
    qrCodes: true,
    analytics: true,
    notifications: true,
    fileUpload: true,
  },
  
  // Upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxFiles: 5,
  },
  
  // UI
  ui: {
    toastDuration: 4000, // 4 segundos
    debounceDelay: 300, // 300ms
    paginationSize: 20,
  },
  
  // Cache
  cache: {
    qrCodeTtl: 24 * 60 * 60 * 1000, // 24 horas
    userDataTtl: 60 * 60 * 1000, // 1 hora
  },
  
  // External Services
  external: {
    qrApiUrl: undefined,
    analyticsId: undefined,
  },
};

/**
 * Criar configuração baseada em variáveis de ambiente
 */
const createConfig = (): Config => {
  return {
    // API - Always use explicit API URL in production
    apiUrl: env.VITE_API_BASE_URL || defaultConfig.apiUrl,
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || String(defaultConfig.apiTimeout)),
    
    // Environment
    isDevelopment: isDevelopment,
    isProduction: isProduction,
    
    // Features
    features: {
      qrCodes: env.VITE_FEATURE_QR_CODES !== 'false',
      analytics: env.VITE_FEATURE_ANALYTICS !== 'false',
      notifications: env.VITE_FEATURE_NOTIFICATIONS !== 'false',
      fileUpload: env.VITE_FEATURE_FILE_UPLOAD !== 'false',
    },
    
    // Upload
    upload: {
      maxSize: parseInt(env.VITE_UPLOAD_MAX_SIZE || String(defaultConfig.upload.maxSize)),
      allowedTypes: env.VITE_UPLOAD_ALLOWED_TYPES 
        ? env.VITE_UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim())
        : defaultConfig.upload.allowedTypes,
      maxFiles: parseInt(env.VITE_UPLOAD_MAX_FILES || String(defaultConfig.upload.maxFiles)),
    },
    
    // UI
    ui: {
      toastDuration: parseInt(env.VITE_TOAST_DURATION || String(defaultConfig.ui.toastDuration)),
      debounceDelay: parseInt(env.VITE_DEBOUNCE_DELAY || String(defaultConfig.ui.debounceDelay)),
      paginationSize: parseInt(env.VITE_PAGINATION_SIZE || String(defaultConfig.ui.paginationSize)),
    },
    
    // Cache
    cache: {
      qrCodeTtl: parseInt(env.VITE_QR_CACHE_TTL || String(defaultConfig.cache.qrCodeTtl)),
      userDataTtl: parseInt(env.VITE_USER_CACHE_TTL || String(defaultConfig.cache.userDataTtl)),
    },
    
    // External Services
    external: {
      qrApiUrl: env.VITE_QR_API_URL,
      analyticsId: env.VITE_ANALYTICS_ID,
    },
  };
};

/**
 * Validar configuração
 */
const validateConfig = (config: Config): void => {
  const errors: string[] = [];
  
  // Validar URL da API (apenas se for URL absoluta)
  if (config.apiUrl.startsWith('http')) {
    try {
      new URL(config.apiUrl);
    } catch {
      errors.push('VITE_API_URL deve ser uma URL válida');
    }
  }
  
  // Validar timeouts
  if (config.apiTimeout < 1000) {
    errors.push('VITE_API_TIMEOUT deve ser pelo menos 1000ms');
  }
  
  // Validar upload
  if (config.upload.maxSize < 1024) {
    errors.push('VITE_UPLOAD_MAX_SIZE deve ser pelo menos 1024 bytes');
  }
  
  if (config.upload.maxFiles < 1) {
    errors.push('VITE_UPLOAD_MAX_FILES deve ser pelo menos 1');
  }
  
  // Validar UI
  if (config.ui.toastDuration < 1000) {
    errors.push('VITE_TOAST_DURATION deve ser pelo menos 1000ms');
  }
  
  if (config.ui.debounceDelay < 100) {
    errors.push('VITE_DEBOUNCE_DELAY deve ser pelo menos 100ms');
  }
  
  if (config.ui.paginationSize < 5) {
    errors.push('VITE_PAGINATION_SIZE deve ser pelo menos 5');
  }
  
  if (errors.length > 0) {
    
    if (config.isProduction) {
      throw new Error('Configuração inválida em produção');
    }
  }
};

/**
 * Log da configuração (apenas em desenvolvimento)
 */
const logConfig = (config: Config): void => {
  if (!config.isDevelopment) return;
  
};

/**
 * Utilitários de configuração
 */
export const configUtils = {
  /**
   * Verificar se uma feature está habilitada
   */
  isFeatureEnabled: (feature: keyof Config['features']): boolean => {
    return config.features[feature];
  },
  
  /**
   * Formatar tamanho de arquivo
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Verificar se tipo de arquivo é permitido
   */
  isFileTypeAllowed: (type: string): boolean => {
    return config.upload.allowedTypes.includes(type);
  },
  
  /**
   * Verificar se arquivo excede tamanho máximo
   */
  isFileSizeValid: (size: number): boolean => {
    return size <= config.upload.maxSize;
  },
};

// Criar e validar configuração
const config = createConfig();
validateConfig(config);
logConfig(config);

export default config;
