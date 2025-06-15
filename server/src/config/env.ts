import { z } from 'zod';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Schema de validação para variáveis de ambiente
 * Garante que todas as variáveis necessárias estão configuradas
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGIN: z.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val, 10)).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('900000'), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(val => parseInt(val, 10)).default('12'),
  
  // QR Code
  QR_CODE_BASE_URL: z.string().url().default('http://localhost:3001/validation'),
  
  // Email (opcional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Redis (opcional)
  REDIS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  REDIS_URL: z.string().optional(),

  // Monitoring (opcional)
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Validar e exportar configurações de ambiente
 */
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Erro de configuração de ambiente:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    console.error('\n📋 Verifique o arquivo .env e configure as variáveis necessárias.');
    process.exit(1);
  }
  throw error;
}

/**
 * Configurações derivadas
 */
export const config = {
  ...env,
  
  // Configurações derivadas
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // CORS origins
  corsOrigins: env.CORS_ORIGIN 
    ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
      ],
  
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  
  // File upload
  upload: {
    maxSize: env.MAX_FILE_SIZE,
    path: env.UPLOAD_PATH,
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    
    // Rate limits específicos
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5, // 5 tentativas de login
    },
    
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 10, // 10 uploads
    },
    
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100, // 100 requests
    },
  },
  
  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
  
  // QR Code
  qrCode: {
    baseUrl: env.QR_CODE_BASE_URL,
  },
  
  // Email
  email: env.SMTP_HOST ? {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  } : null,
  
  // Redis
  redis: {
    enabled: env.REDIS_ENABLED,
    url: env.REDIS_URL,
  },

  // Monitoring
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    logLevel: env.LOG_LEVEL,
  },
};

/**
 * Validar configurações adicionais em runtime
 */
export const validateConfig = () => {
  const errors: string[] = [];
  
  // Validar JWT secret em produção
  if (config.isProduction && config.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET deve ter pelo menos 64 caracteres em produção');
  }
  
  // Validar configuração de email se necessário
  if (config.email && (!config.email.user || !config.email.pass)) {
    errors.push('SMTP_USER e SMTP_PASS são obrigatórios quando SMTP_HOST está configurado');
  }
  
  // Validar URLs
  try {
    new URL(config.QR_CODE_BASE_URL);
    new URL(config.FRONTEND_URL);
  } catch (error) {
    errors.push('URLs de configuração inválidas');
  }
  
  if (errors.length > 0) {
    console.error('❌ Erros de validação de configuração:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Configuração de ambiente validada com sucesso');
};

/**
 * Exibir informações de configuração (sem dados sensíveis)
 */
export const logConfig = () => {
  if (!config.isDevelopment) return;
  
  console.log('🔧 Configuração do servidor:');
  console.log(`  - Ambiente: ${config.NODE_ENV}`);
  console.log(`  - Porta: ${config.PORT}`);
  console.log(`  - Frontend: ${config.FRONTEND_URL}`);
  console.log(`  - QR Base URL: ${config.QR_CODE_BASE_URL}`);
  console.log(`  - Upload Path: ${config.UPLOAD_PATH}`);
  console.log(`  - Max File Size: ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  - Rate Limit: ${config.RATE_LIMIT_MAX_REQUESTS} req/${config.RATE_LIMIT_WINDOW_MS}ms`);
  console.log(`  - Email: ${config.email ? 'Configurado' : 'Não configurado'}`);
  console.log(`  - Monitoring: ${config.monitoring.sentryDsn ? 'Configurado' : 'Não configurado'}`);
};

// Export commonly used values
export const { isDevelopment, isProduction, isTest } = config;

export default config;
