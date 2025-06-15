import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Define environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'test', 'production', 'staging'])
    .default('development'),
  
  // Server configuration
  PORT: z
    .string()
    .default('9100')
    .transform((val) => parseInt(val, 10))
    .refine((port) => port > 0 && port < 65536, 'Invalid port number'),
  
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'Database URL is required'),
  
  DATABASE_POOL_MIN: z
    .string()
    .default('2')
    .transform((val) => parseInt(val, 10)),
  
  DATABASE_POOL_MAX: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  
  // Security
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters long'),
  
  JWT_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((val) => /^\d+[hdwmy]$/.test(val), 'Invalid duration format'),
  
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default('30d')
    .refine((val) => /^\d+[hdwmy]$/.test(val), 'Invalid duration format'),
  
  BCRYPT_ROUNDS: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((rounds) => rounds >= 10 && rounds <= 20, 'Bcrypt rounds must be between 10 and 20'),
  
  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map(origin => origin.trim())),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000') // 15 minutes
    .transform((val) => parseInt(val, 10)),
  
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),
  
  RATE_LIMIT_WHITELIST: z
    .string()
    .optional()
    .transform((val) => val ? val.split(',').map(ip => ip.trim()) : []),
  
  // API Keys
  OPENAI_API_KEY: z
    .string()
    .optional()
    .refine((key) => !key || key.startsWith('sk-'), 'Invalid OpenAI API key format'),
  
  OPENAI_MODEL: z
    .string()
    .default('gpt-4-turbo-preview'),
  
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .refine((key) => !key || key.length > 20, 'Invalid Anthropic API key'),
  
  // Email
  SENDGRID_API_KEY: z
    .string()
    .optional()
    .refine((key) => !key || key.startsWith('SG.'), 'Invalid SendGrid API key format'),
  
  EMAIL_FROM: z
    .string()
    .email()
    .default('noreply@trustlabel.com'),
  
  EMAIL_REPLY_TO: z
    .string()
    .email()
    .default('support@trustlabel.com'),
  
  // Redis
  REDIS_URL: z
    .string()
    .optional()
    .refine((url) => !url || url.startsWith('redis://'), 'Invalid Redis URL'),
  
  REDIS_TTL: z
    .string()
    .default('3600') // 1 hour
    .transform((val) => parseInt(val, 10)),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .refine((key) => !key || key.length === 20, 'Invalid AWS access key format'),
  
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .refine((key) => !key || key.length === 40, 'Invalid AWS secret key format'),
  
  AWS_REGION: z
    .string()
    .default('us-east-1')
    .refine((region) => /^[a-z]{2}-[a-z]+-\d{1}$/.test(region), 'Invalid AWS region format'),
  
  AWS_S3_BUCKET: z
    .string()
    .optional()
    .refine((bucket) => !bucket || /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket), 'Invalid S3 bucket name'),
  
  // File upload
  MAX_FILE_SIZE: z
    .string()
    .default('10485760') // 10MB in bytes
    .transform((val) => parseInt(val, 10)),
  
  ALLOWED_FILE_TYPES: z
    .string()
    .default('image/jpeg,image/png,image/gif,image/webp,application/pdf')
    .transform((val) => val.split(',').map(type => type.trim())),
  
  // Frontend URLs
  FRONTEND_URL: z
    .string()
    .url()
    .default('http://localhost:9101'),
  
  API_URL: z
    .string()
    .url()
    .default('http://localhost:9100'),
  
  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'verbose'])
    .default('info'),
  
  LOG_FORMAT: z
    .enum(['json', 'simple', 'detailed'])
    .default('json'),
  
  // Monitoring
  SENTRY_DSN: z
    .string()
    .optional()
    .refine((dsn) => !dsn || dsn.startsWith('https://'), 'Invalid Sentry DSN'),
  
  NEW_RELIC_LICENSE_KEY: z
    .string()
    .optional(),
  
  // Feature flags
  ENABLE_AI_VALIDATION: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  
  ENABLE_BLOCKCHAIN: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  ENABLE_NOTIFICATIONS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  
  ENABLE_ANALYTICS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  
  // Maintenance mode
  MAINTENANCE_MODE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  
  MAINTENANCE_MESSAGE: z
    .string()
    .default('System is under maintenance. Please try again later.'),
  
  // API versioning
  API_VERSION: z
    .string()
    .default('v1')
    .refine((version) => /^v\d+$/.test(version), 'Invalid API version format'),
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((size) => size > 0 && size <= 100, 'Page size must be between 1 and 100'),
  
  MAX_PAGE_SIZE: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),
  
  // Cache configuration
  CACHE_TTL_SHORT: z
    .string()
    .default('300') // 5 minutes
    .transform((val) => parseInt(val, 10)),
  
  CACHE_TTL_MEDIUM: z
    .string()
    .default('3600') // 1 hour
    .transform((val) => parseInt(val, 10)),
  
  CACHE_TTL_LONG: z
    .string()
    .default('86400') // 24 hours
    .transform((val) => parseInt(val, 10)),
  
  // External APIs
  ANVISA_API_URL: z
    .string()
    .url()
    .optional(),
  
  ANVISA_API_KEY: z
    .string()
    .optional(),
  
  // Webhook configuration
  WEBHOOK_SECRET: z
    .string()
    .optional()
    .refine((secret) => !secret || secret.length >= 16, 'Webhook secret must be at least 16 characters'),
  
  WEBHOOK_TIMEOUT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  
  // Queue configuration
  QUEUE_CONCURRENCY: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10)),
  
  QUEUE_RETRY_ATTEMPTS: z
    .string()
    .default('3')
    .transform((val) => parseInt(val, 10)),
  
  QUEUE_RETRY_DELAY: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(error.errors, null, 2));
    process.exit(1);
  }
  throw error;
}

// Export validated config
export const config = env;

// Export type for TypeScript
export type Config = typeof config;

// Helper functions
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isTesting = () => config.NODE_ENV === 'test';
export const isStaging = () => config.NODE_ENV === 'staging';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof features): boolean => {
  return features[feature];
};

export const features = {
  aiValidation: config.ENABLE_AI_VALIDATION,
  blockchain: config.ENABLE_BLOCKCHAIN,
  notifications: config.ENABLE_NOTIFICATIONS,
  analytics: config.ENABLE_ANALYTICS,
} as const;

// Database config helper
export const getDatabaseConfig = () => ({
  url: config.DATABASE_URL,
  pool: {
    min: config.DATABASE_POOL_MIN,
    max: config.DATABASE_POOL_MAX,
  },
});

// JWT config helper
export const getJwtConfig = () => ({
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshExpiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
});

// Email config helper
export const getEmailConfig = () => ({
  apiKey: config.SENDGRID_API_KEY,
  from: config.EMAIL_FROM,
  replyTo: config.EMAIL_REPLY_TO,
});

// AWS config helper
export const getAwsConfig = () => ({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION,
  s3Bucket: config.AWS_S3_BUCKET,
});

// Redis config helper
export const getRedisConfig = () => ({
  url: config.REDIS_URL,
  ttl: config.REDIS_TTL,
});

// Rate limit config helper
export const getRateLimitConfig = () => ({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  whitelist: config.RATE_LIMIT_WHITELIST,
});

// Validate critical configurations on startup
export const validateCriticalConfigs = () => {
  const errors: string[] = [];

  // Check database connection
  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Check JWT secret in production
  if (isProduction() && config.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET should be at least 64 characters in production');
  }

  // Check required services in production
  if (isProduction()) {
    if (!config.SENDGRID_API_KEY) {
      errors.push('SENDGRID_API_KEY is required in production');
    }
    
    if (!config.REDIS_URL) {
      errors.push('REDIS_URL is required in production');
    }
    
    if (!config.SENTRY_DSN) {
      errors.push('SENTRY_DSN is recommended in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Critical configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction()) {
      process.exit(1);
    } else {
      console.warn('⚠️  Running in development mode with missing configurations');
    }
  }
};

// Export for use in other modules
export default config;