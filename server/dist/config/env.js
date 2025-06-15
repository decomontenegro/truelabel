"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConfig = exports.validateConfig = exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL deve ser uma URL válida'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(val => parseInt(val, 10)).default('3000'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3001'),
    CORS_ORIGIN: zod_1.z.string().optional(),
    MAX_FILE_SIZE: zod_1.z.string().transform(val => parseInt(val, 10)).default('10485760'),
    UPLOAD_PATH: zod_1.z.string().default('./uploads'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(val => parseInt(val, 10)).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(val => parseInt(val, 10)).default('100'),
    BCRYPT_ROUNDS: zod_1.z.string().transform(val => parseInt(val, 10)).default('12'),
    QR_CODE_BASE_URL: zod_1.z.string().url().default('http://localhost:3001/validation'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(val => parseInt(val, 10)).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SENTRY_DSN: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
let env;
try {
    env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Erro de configuração de ambiente:');
        error.errors.forEach(err => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.error('\n📋 Verifique o arquivo .env e configure as variáveis necessárias.');
        process.exit(1);
    }
    throw error;
}
exports.config = {
    ...env,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    corsOrigins: env.CORS_ORIGIN
        ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : [
            env.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:5173',
        ],
    database: {
        url: env.DATABASE_URL,
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
    },
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
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
        auth: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
        },
        upload: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 10,
        },
        api: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
        },
    },
    security: {
        bcryptRounds: env.BCRYPT_ROUNDS,
    },
    qrCode: {
        baseUrl: env.QR_CODE_BASE_URL,
    },
    email: env.SMTP_HOST ? {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    } : null,
    monitoring: {
        sentryDsn: env.SENTRY_DSN,
        logLevel: env.LOG_LEVEL,
    },
};
const validateConfig = () => {
    const errors = [];
    if (exports.config.isProduction && exports.config.JWT_SECRET.length < 64) {
        errors.push('JWT_SECRET deve ter pelo menos 64 caracteres em produção');
    }
    if (exports.config.email && (!exports.config.email.user || !exports.config.email.pass)) {
        errors.push('SMTP_USER e SMTP_PASS são obrigatórios quando SMTP_HOST está configurado');
    }
    try {
        new URL(exports.config.QR_CODE_BASE_URL);
        new URL(exports.config.FRONTEND_URL);
    }
    catch (error) {
        errors.push('URLs de configuração inválidas');
    }
    if (errors.length > 0) {
        console.error('❌ Erros de validação de configuração:');
        errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
    }
    console.log('✅ Configuração de ambiente validada com sucesso');
};
exports.validateConfig = validateConfig;
const logConfig = () => {
    if (!exports.config.isDevelopment)
        return;
    console.log('🔧 Configuração do servidor:');
    console.log(`  - Ambiente: ${exports.config.NODE_ENV}`);
    console.log(`  - Porta: ${exports.config.PORT}`);
    console.log(`  - Frontend: ${exports.config.FRONTEND_URL}`);
    console.log(`  - QR Base URL: ${exports.config.QR_CODE_BASE_URL}`);
    console.log(`  - Upload Path: ${exports.config.UPLOAD_PATH}`);
    console.log(`  - Max File Size: ${(exports.config.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  - Rate Limit: ${exports.config.RATE_LIMIT_MAX_REQUESTS} req/${exports.config.RATE_LIMIT_WINDOW_MS}ms`);
    console.log(`  - Email: ${exports.config.email ? 'Configurado' : 'Não configurado'}`);
    console.log(`  - Monitoring: ${exports.config.monitoring.sentryDsn ? 'Configurado' : 'Não configurado'}`);
};
exports.logConfig = logConfig;
exports.default = exports.config;
//# sourceMappingURL=env.js.map