import { z } from 'zod';

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_QR_BASE_URL: z.string().default('/api'),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('production'),
  // Features
  VITE_FEATURE_QR_CODES: z.string().optional().default('true'),
  VITE_FEATURE_ANALYTICS: z.string().optional().default('true'),
  VITE_FEATURE_NOTIFICATIONS: z.string().optional().default('true'),
  VITE_FEATURE_FILE_UPLOAD: z.string().optional().default('true'),
  // Upload
  VITE_UPLOAD_MAX_SIZE: z.string().optional().default('10485760'),
  VITE_UPLOAD_MAX_FILES: z.string().optional().default('5'),
  VITE_UPLOAD_ALLOWED_TYPES: z.string().optional(),
  // UI
  VITE_TOAST_DURATION: z.string().optional().default('4000'),
  VITE_DEBOUNCE_DELAY: z.string().optional().default('300'),
  VITE_PAGINATION_SIZE: z.string().optional().default('20'),
  // Cache
  VITE_QR_CACHE_TTL: z.string().optional().default('86400000'),
  VITE_USER_CACHE_TTL: z.string().optional().default('3600000'),
  // External
  VITE_QR_API_URL: z.string().optional(),
  VITE_ANALYTICS_ID: z.string().optional(),
});

// Tipo inferido do schema
export type EnvConfig = z.infer<typeof envSchema>;

// Função para validar e retornar as variáveis de ambiente
export function validateEnv(): EnvConfig {
  try {
    // Parse e valida as variáveis
    const env = envSchema.parse({
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_QR_BASE_URL: import.meta.env.VITE_QR_BASE_URL,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
      // Features
      VITE_FEATURE_QR_CODES: import.meta.env.VITE_FEATURE_QR_CODES,
      VITE_FEATURE_ANALYTICS: import.meta.env.VITE_FEATURE_ANALYTICS,
      VITE_FEATURE_NOTIFICATIONS: import.meta.env.VITE_FEATURE_NOTIFICATIONS,
      VITE_FEATURE_FILE_UPLOAD: import.meta.env.VITE_FEATURE_FILE_UPLOAD,
      // Upload
      VITE_UPLOAD_MAX_SIZE: import.meta.env.VITE_UPLOAD_MAX_SIZE,
      VITE_UPLOAD_MAX_FILES: import.meta.env.VITE_UPLOAD_MAX_FILES,
      VITE_UPLOAD_ALLOWED_TYPES: import.meta.env.VITE_UPLOAD_ALLOWED_TYPES,
      // UI
      VITE_TOAST_DURATION: import.meta.env.VITE_TOAST_DURATION,
      VITE_DEBOUNCE_DELAY: import.meta.env.VITE_DEBOUNCE_DELAY,
      VITE_PAGINATION_SIZE: import.meta.env.VITE_PAGINATION_SIZE,
      // Cache
      VITE_QR_CACHE_TTL: import.meta.env.VITE_QR_CACHE_TTL,
      VITE_USER_CACHE_TTL: import.meta.env.VITE_USER_CACHE_TTL,
      // External
      VITE_QR_API_URL: import.meta.env.VITE_QR_API_URL,
      VITE_ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
    });

    // Log de sucesso em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('✅ Environment variables validated successfully');
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      // Em produção, lança erro para prevenir execução com config inválida
      if (import.meta.env.PROD) {
        throw new Error('Invalid environment configuration. Please check your environment variables.');
      }
    }
    
    // Em desenvolvimento, retorna valores padrão
    return envSchema.parse({});
  }
}

// Exporta as variáveis validadas
export const env = validateEnv();

// Helper para verificar ambiente
export const isDevelopment = env.VITE_ENVIRONMENT === 'development';
export const isStaging = env.VITE_ENVIRONMENT === 'staging';
export const isProduction = env.VITE_ENVIRONMENT === 'production';