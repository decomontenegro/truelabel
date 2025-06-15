"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.isProduction = exports.isTest = exports.isDevelopment = exports.env = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    DATABASE_URL: zod_1.z.string().url().or(zod_1.z.string().startsWith('file:')),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    BCRYPT_ROUNDS: zod_1.z.string().transform(Number).default('12'),
    CORS_ORIGIN: zod_1.z.string().transform(val => val.split(',').map(origin => origin.trim())),
    REDIS_URL: zod_1.z.string().url().optional(),
    REDIS_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    SENTRY_DSN: zod_1.z.string().url().optional(),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    MAX_FILE_SIZE: zod_1.z.string().transform(val => parseInt(val) * 1024 * 1024).default('10'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().default('us-east-1'),
    S3_BUCKET: zod_1.z.string().optional(),
});
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
            const missingVars = requiredVars.filter(varName => !process.env[varName]);
            if (missingVars.length > 0) {
                console.error('\n📋 Missing required environment variables:');
                missingVars.forEach(varName => {
                    console.error(`  - ${varName}`);
                });
                console.error('\n💡 Create a .env file in the server directory with these variables.');
            }
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Invalid environment configuration. Server cannot start.');
            }
            throw new Error('Invalid environment configuration. Please check your .env file.');
        }
        throw error;
    }
}
exports.env = validateEnv();
exports.isDevelopment = exports.env.NODE_ENV === 'development';
exports.isTest = exports.env.NODE_ENV === 'test';
exports.isProduction = exports.env.NODE_ENV === 'production';
exports.config = {
    server: {
        port: exports.env.PORT,
        env: exports.env.NODE_ENV,
    },
    database: {
        url: exports.env.DATABASE_URL,
        logging: exports.isDevelopment,
    },
    auth: {
        jwtSecret: exports.env.JWT_SECRET,
        jwtExpiresIn: exports.env.JWT_EXPIRES_IN,
        bcryptRounds: exports.env.BCRYPT_ROUNDS,
    },
    cors: {
        origin: exports.env.CORS_ORIGIN,
        credentials: true,
    },
    redis: {
        enabled: exports.env.REDIS_ENABLED,
        url: exports.env.REDIS_URL,
    },
    storage: {
        uploadDir: exports.env.UPLOAD_DIR,
        maxFileSize: exports.env.MAX_FILE_SIZE,
    },
    email: {
        enabled: !!exports.env.SMTP_HOST,
        smtp: {
            host: exports.env.SMTP_HOST,
            port: exports.env.SMTP_PORT,
            auth: {
                user: exports.env.SMTP_USER,
                pass: exports.env.SMTP_PASS,
            },
        },
        from: exports.env.EMAIL_FROM,
    },
    external: {
        sentry: {
            enabled: !!exports.env.SENTRY_DSN,
            dsn: exports.env.SENTRY_DSN,
        },
        aws: {
            enabled: !!exports.env.AWS_ACCESS_KEY_ID,
            accessKeyId: exports.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: exports.env.AWS_SECRET_ACCESS_KEY,
            region: exports.env.AWS_REGION,
            s3Bucket: exports.env.S3_BUCKET,
        },
        openai: {
            enabled: !!exports.env.OPENAI_API_KEY,
            apiKey: exports.env.OPENAI_API_KEY,
        },
    },
};
exports.default = exports.config;
//# sourceMappingURL=env-validation.js.map