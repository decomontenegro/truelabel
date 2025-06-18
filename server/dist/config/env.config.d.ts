export declare const config: {
    PORT: number;
    NODE_ENV: "development" | "production" | "test" | "staging";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    FRONTEND_URL: string;
    MAX_FILE_SIZE: number;
    RATE_LIMIT_WINDOW_MS: number;
    BCRYPT_ROUNDS: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug" | "verbose";
    DATABASE_POOL_MIN: number;
    DATABASE_POOL_MAX: number;
    REFRESH_TOKEN_EXPIRES_IN: string;
    ALLOWED_ORIGINS: string[];
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WHITELIST: string[];
    OPENAI_MODEL: string;
    EMAIL_FROM: string;
    EMAIL_REPLY_TO: string;
    REDIS_TTL: number;
    AWS_REGION: string;
    ALLOWED_FILE_TYPES: string[];
    API_URL: string;
    LOG_FORMAT: "json" | "simple" | "detailed";
    ENABLE_AI_VALIDATION: boolean;
    ENABLE_BLOCKCHAIN: boolean;
    ENABLE_NOTIFICATIONS: boolean;
    ENABLE_ANALYTICS: boolean;
    MAINTENANCE_MODE: boolean;
    MAINTENANCE_MESSAGE: string;
    API_VERSION: string;
    DEFAULT_PAGE_SIZE: number;
    MAX_PAGE_SIZE: number;
    CACHE_TTL_SHORT: number;
    CACHE_TTL_MEDIUM: number;
    CACHE_TTL_LONG: number;
    WEBHOOK_TIMEOUT: number;
    QUEUE_CONCURRENCY: number;
    QUEUE_RETRY_ATTEMPTS: number;
    QUEUE_RETRY_DELAY: number;
    REDIS_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_S3_BUCKET?: string | undefined;
    NEW_RELIC_LICENSE_KEY?: string | undefined;
    ANVISA_API_URL?: string | undefined;
    ANVISA_API_KEY?: string | undefined;
    WEBHOOK_SECRET?: string | undefined;
};
export type Config = typeof config;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isTesting: () => boolean;
export declare const isStaging: () => boolean;
export declare const isFeatureEnabled: (feature: keyof typeof features) => boolean;
export declare const features: {
    readonly aiValidation: boolean;
    readonly blockchain: boolean;
    readonly notifications: boolean;
    readonly analytics: boolean;
};
export declare const getDatabaseConfig: () => {
    url: string;
    pool: {
        min: number;
        max: number;
    };
};
export declare const getJwtConfig: () => {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
};
export declare const getEmailConfig: () => {
    apiKey: string | undefined;
    from: string;
    replyTo: string;
};
export declare const getAwsConfig: () => {
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    region: string;
    s3Bucket: string | undefined;
};
export declare const getRedisConfig: () => {
    url: string | undefined;
    ttl: number;
};
export declare const getRateLimitConfig: () => {
    windowMs: number;
    max: number;
    whitelist: string[];
};
export declare const validateCriticalConfigs: () => void;
export default config;
//# sourceMappingURL=env.config.d.ts.map