import { z } from 'zod';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Schema de validação das variáveis de ambiente do backend
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  DATABASE_URL: z.string().url().or(z.string().startsWith('file:')),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // CORS
  CORS_ORIGIN: z.string().transform(val => val.split(',').map(origin => origin.trim())),
  
  // Redis (opcional)
  REDIS_URL: z.string().url().optional(),
  REDIS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // Sentry (opcional)
  SENTRY_DSN: z.string().url().optional(),
  
  // Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val) * 1024 * 1024).default('10'), // MB para bytes
  
  // Email (opcional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // External APIs (opcional)
  OPENAI_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
});

// Tipo inferido do schema
export type EnvConfig = z.infer<typeof envSchema>;

// Função para validar e retornar as variáveis de ambiente
export function validateEnv(): EnvConfig {
  try {
    // Parse e valida as variáveis
    const env = envSchema.parse(process.env);
    
    // Log de sucesso em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Environment variables validated successfully');
      console.log('📝 Configuration:');
      console.log(`  - Environment: ${env.NODE_ENV}`);
      console.log(`  - Port: ${env.PORT}`);
      console.log(`  - Database: ${env.DATABASE_URL.substring(0, 20)}...`);
      console.log(`  - Redis: ${env.REDIS_ENABLED ? 'Enabled' : 'Disabled'}`);
      console.log(`  - Sentry: ${env.SENTRY_DSN ? 'Configured' : 'Not configured'}`);
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      // Lista variáveis obrigatórias que estão faltando
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('\n📋 Missing required environment variables:');
        missingVars.forEach(varName => {
          console.error(`  - ${varName}`);
        });
        console.error('\n💡 Create a .env file in the server directory with these variables.');
      }
      
      // Em produção, sempre lança erro
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid environment configuration. Server cannot start.');
      }
      
      // Em desenvolvimento, lança erro para forçar configuração correta
      throw new Error('Invalid environment configuration. Please check your .env file.');
    }
    
    throw error;
  }
}

// Exporta as variáveis validadas
export const env = validateEnv();

// Helpers para verificar ambiente
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isProduction = env.NODE_ENV === 'production';

// Configurações derivadas
export const config = {
  // Server
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    logging: isDevelopment,
  },
  
  // Auth
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
  
  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
  
  // Redis
  redis: {
    enabled: env.REDIS_ENABLED,
    url: env.REDIS_URL,
  },
  
  // Storage
  storage: {
    uploadDir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  },
  
  // Email
  email: {
    enabled: !!env.SMTP_HOST,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    },
    from: env.EMAIL_FROM,
  },
  
  // External services
  external: {
    sentry: {
      enabled: !!env.SENTRY_DSN,
      dsn: env.SENTRY_DSN,
    },
    aws: {
      enabled: !!env.AWS_ACCESS_KEY_ID,
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      s3Bucket: env.S3_BUCKET,
    },
    openai: {
      enabled: !!env.OPENAI_API_KEY,
      apiKey: env.OPENAI_API_KEY,
    },
  },
} as const;

export default config;