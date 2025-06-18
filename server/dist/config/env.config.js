"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCriticalConfigs = exports.getRateLimitConfig = exports.getRedisConfig = exports.getAwsConfig = exports.getEmailConfig = exports.getJwtConfig = exports.getDatabaseConfig = exports.features = exports.isFeatureEnabled = exports.isStaging = exports.isTesting = exports.isProduction = exports.isDevelopment = exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
dotenv_1.default.config({ path: (0, path_1.resolve)(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production', 'staging'])
        .default('development'),
    PORT: zod_1.z
        .string()
        .default('9100')
        .transform((val) => parseInt(val, 10))
        .refine((port) => port > 0 && port < 65536, 'Invalid port number'),
    DATABASE_URL: zod_1.z
        .string()
        .min(1, 'Database URL is required'),
    DATABASE_POOL_MIN: zod_1.z
        .string()
        .default('2')
        .transform((val) => parseInt(val, 10)),
    DATABASE_POOL_MAX: zod_1.z
        .string()
        .default('10')
        .transform((val) => parseInt(val, 10)),
    JWT_SECRET: zod_1.z
        .string()
        .min(32, 'JWT secret must be at least 32 characters long'),
    JWT_EXPIRES_IN: zod_1.z
        .string()
        .default('7d')
        .refine((val) => /^\d+[hdwmy]$/.test(val), 'Invalid duration format'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z
        .string()
        .default('30d')
        .refine((val) => /^\d+[hdwmy]$/.test(val), 'Invalid duration format'),
    BCRYPT_ROUNDS: zod_1.z
        .string()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .refine((rounds) => rounds >= 10 && rounds <= 20, 'Bcrypt rounds must be between 10 and 20'),
    ALLOWED_ORIGINS: zod_1.z
        .string()
        .default('http://localhost:3000')
        .transform((val) => val.split(',').map(origin => origin.trim())),
    RATE_LIMIT_WINDOW_MS: zod_1.z
        .string()
        .default('900000')
        .transform((val) => parseInt(val, 10)),
    RATE_LIMIT_MAX: zod_1.z
        .string()
        .default('100')
        .transform((val) => parseInt(val, 10)),
    RATE_LIMIT_WHITELIST: zod_1.z
        .string()
        .optional()
        .transform((val) => val ? val.split(',').map(ip => ip.trim()) : []),
    OPENAI_API_KEY: zod_1.z
        .string()
        .optional()
        .refine((key) => !key || key.startsWith('sk-'), 'Invalid OpenAI API key format'),
    OPENAI_MODEL: zod_1.z
        .string()
        .default('gpt-4-turbo-preview'),
    ANTHROPIC_API_KEY: zod_1.z
        .string()
        .optional()
        .refine((key) => !key || key.length > 20, 'Invalid Anthropic API key'),
    SENDGRID_API_KEY: zod_1.z
        .string()
        .optional()
        .refine((key) => !key || key.startsWith('SG.'), 'Invalid SendGrid API key format'),
    EMAIL_FROM: zod_1.z
        .string()
        .email()
        .default('noreply@trustlabel.com'),
    EMAIL_REPLY_TO: zod_1.z
        .string()
        .email()
        .default('support@trustlabel.com'),
    REDIS_URL: zod_1.z
        .string()
        .optional()
        .refine((url) => !url || url.startsWith('redis://'), 'Invalid Redis URL'),
    REDIS_TTL: zod_1.z
        .string()
        .default('3600')
        .transform((val) => parseInt(val, 10)),
    AWS_ACCESS_KEY_ID: zod_1.z
        .string()
        .optional()
        .refine((key) => !key || key.length === 20, 'Invalid AWS access key format'),
    AWS_SECRET_ACCESS_KEY: zod_1.z
        .string()
        .optional()
        .refine((key) => !key || key.length === 40, 'Invalid AWS secret key format'),
    AWS_REGION: zod_1.z
        .string()
        .default('us-east-1')
        .refine((region) => /^[a-z]{2}-[a-z]+-\d{1}$/.test(region), 'Invalid AWS region format'),
    AWS_S3_BUCKET: zod_1.z
        .string()
        .optional()
        .refine((bucket) => !bucket || /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket), 'Invalid S3 bucket name'),
    MAX_FILE_SIZE: zod_1.z
        .string()
        .default('10485760')
        .transform((val) => parseInt(val, 10)),
    ALLOWED_FILE_TYPES: zod_1.z
        .string()
        .default('image/jpeg,image/png,image/gif,image/webp,application/pdf')
        .transform((val) => val.split(',').map(type => type.trim())),
    FRONTEND_URL: zod_1.z
        .string()
        .url()
        .default('http://localhost:9101'),
    API_URL: zod_1.z
        .string()
        .url()
        .default('http://localhost:9100'),
    LOG_LEVEL: zod_1.z
        .enum(['error', 'warn', 'info', 'debug', 'verbose'])
        .default('info'),
    LOG_FORMAT: zod_1.z
        .enum(['json', 'simple', 'detailed'])
        .default('json'),
    SENTRY_DSN: zod_1.z
        .string()
        .optional()
        .refine((dsn) => !dsn || dsn.startsWith('https://'), 'Invalid Sentry DSN'),
    NEW_RELIC_LICENSE_KEY: zod_1.z
        .string()
        .optional(),
    ENABLE_AI_VALIDATION: zod_1.z
        .string()
        .default('true')
        .transform((val) => val === 'true'),
    ENABLE_BLOCKCHAIN: zod_1.z
        .string()
        .default('false')
        .transform((val) => val === 'true'),
    ENABLE_NOTIFICATIONS: zod_1.z
        .string()
        .default('true')
        .transform((val) => val === 'true'),
    ENABLE_ANALYTICS: zod_1.z
        .string()
        .default('true')
        .transform((val) => val === 'true'),
    MAINTENANCE_MODE: zod_1.z
        .string()
        .default('false')
        .transform((val) => val === 'true'),
    MAINTENANCE_MESSAGE: zod_1.z
        .string()
        .default('System is under maintenance. Please try again later.'),
    API_VERSION: zod_1.z
        .string()
        .default('v1')
        .refine((version) => /^v\d+$/.test(version), 'Invalid API version format'),
    DEFAULT_PAGE_SIZE: zod_1.z
        .string()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .refine((size) => size > 0 && size <= 100, 'Page size must be between 1 and 100'),
    MAX_PAGE_SIZE: zod_1.z
        .string()
        .default('100')
        .transform((val) => parseInt(val, 10)),
    CACHE_TTL_SHORT: zod_1.z
        .string()
        .default('300')
        .transform((val) => parseInt(val, 10)),
    CACHE_TTL_MEDIUM: zod_1.z
        .string()
        .default('3600')
        .transform((val) => parseInt(val, 10)),
    CACHE_TTL_LONG: zod_1.z
        .string()
        .default('86400')
        .transform((val) => parseInt(val, 10)),
    ANVISA_API_URL: zod_1.z
        .string()
        .url()
        .optional(),
    ANVISA_API_KEY: zod_1.z
        .string()
        .optional(),
    WEBHOOK_SECRET: zod_1.z
        .string()
        .optional()
        .refine((secret) => !secret || secret.length >= 16, 'Webhook secret must be at least 16 characters'),
    WEBHOOK_TIMEOUT: zod_1.z
        .string()
        .default('5000')
        .transform((val) => parseInt(val, 10)),
    QUEUE_CONCURRENCY: zod_1.z
        .string()
        .default('5')
        .transform((val) => parseInt(val, 10)),
    QUEUE_RETRY_ATTEMPTS: zod_1.z
        .string()
        .default('3')
        .transform((val) => parseInt(val, 10)),
    QUEUE_RETRY_DELAY: zod_1.z
        .string()
        .default('5000')
        .transform((val) => parseInt(val, 10)),
});
let env;
try {
    env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(error.errors, null, 2));
        process.exit(1);
    }
    throw error;
}
exports.config = env;
const isDevelopment = () => exports.config.NODE_ENV === 'development';
exports.isDevelopment = isDevelopment;
const isProduction = () => exports.config.NODE_ENV === 'production';
exports.isProduction = isProduction;
const isTesting = () => exports.config.NODE_ENV === 'test';
exports.isTesting = isTesting;
const isStaging = () => exports.config.NODE_ENV === 'staging';
exports.isStaging = isStaging;
const isFeatureEnabled = (feature) => {
    return exports.features[feature];
};
exports.isFeatureEnabled = isFeatureEnabled;
exports.features = {
    aiValidation: exports.config.ENABLE_AI_VALIDATION,
    blockchain: exports.config.ENABLE_BLOCKCHAIN,
    notifications: exports.config.ENABLE_NOTIFICATIONS,
    analytics: exports.config.ENABLE_ANALYTICS,
};
const getDatabaseConfig = () => ({
    url: exports.config.DATABASE_URL,
    pool: {
        min: exports.config.DATABASE_POOL_MIN,
        max: exports.config.DATABASE_POOL_MAX,
    },
});
exports.getDatabaseConfig = getDatabaseConfig;
const getJwtConfig = () => ({
    secret: exports.config.JWT_SECRET,
    expiresIn: exports.config.JWT_EXPIRES_IN,
    refreshExpiresIn: exports.config.REFRESH_TOKEN_EXPIRES_IN,
});
exports.getJwtConfig = getJwtConfig;
const getEmailConfig = () => ({
    apiKey: exports.config.SENDGRID_API_KEY,
    from: exports.config.EMAIL_FROM,
    replyTo: exports.config.EMAIL_REPLY_TO,
});
exports.getEmailConfig = getEmailConfig;
const getAwsConfig = () => ({
    accessKeyId: exports.config.AWS_ACCESS_KEY_ID,
    secretAccessKey: exports.config.AWS_SECRET_ACCESS_KEY,
    region: exports.config.AWS_REGION,
    s3Bucket: exports.config.AWS_S3_BUCKET,
});
exports.getAwsConfig = getAwsConfig;
const getRedisConfig = () => ({
    url: exports.config.REDIS_URL,
    ttl: exports.config.REDIS_TTL,
});
exports.getRedisConfig = getRedisConfig;
const getRateLimitConfig = () => ({
    windowMs: exports.config.RATE_LIMIT_WINDOW_MS,
    max: exports.config.RATE_LIMIT_MAX,
    whitelist: exports.config.RATE_LIMIT_WHITELIST,
});
exports.getRateLimitConfig = getRateLimitConfig;
const validateCriticalConfigs = () => {
    const errors = [];
    if (!exports.config.DATABASE_URL) {
        errors.push('DATABASE_URL is required');
    }
    if ((0, exports.isProduction)() && exports.config.JWT_SECRET.length < 64) {
        errors.push('JWT_SECRET should be at least 64 characters in production');
    }
    if ((0, exports.isProduction)()) {
        if (!exports.config.SENDGRID_API_KEY) {
            errors.push('SENDGRID_API_KEY is required in production');
        }
        if (!exports.config.REDIS_URL) {
            errors.push('REDIS_URL is required in production');
        }
        if (!exports.config.SENTRY_DSN) {
            errors.push('SENTRY_DSN is recommended in production');
        }
    }
    if (errors.length > 0) {
        console.error('❌ Critical configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        if ((0, exports.isProduction)()) {
            process.exit(1);
        }
        else {
            console.warn('⚠️  Running in development mode with missing configurations');
        }
    }
};
exports.validateCriticalConfigs = validateCriticalConfigs;
exports.default = exports.config;
//# sourceMappingURL=env.config.js.map