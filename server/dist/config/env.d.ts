export declare const config: {
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    corsOrigins: string[];
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    upload: {
        maxSize: number;
        path: string;
        allowedTypes: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        auth: {
            windowMs: number;
            maxRequests: number;
        };
        upload: {
            windowMs: number;
            maxRequests: number;
        };
        api: {
            windowMs: number;
            maxRequests: number;
        };
    };
    security: {
        bcryptRounds: number;
    };
    qrCode: {
        baseUrl: string;
    };
    email: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
    } | null;
    redis: {
        enabled: boolean;
        url: string | undefined;
    };
    monitoring: {
        sentryDsn: string | undefined;
        logLevel: "error" | "warn" | "info" | "debug";
    };
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    FRONTEND_URL: string;
    MAX_FILE_SIZE: number;
    UPLOAD_PATH: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    BCRYPT_ROUNDS: number;
    QR_CODE_BASE_URL: string;
    REDIS_ENABLED: boolean;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    CORS_ORIGIN?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    REDIS_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
};
export declare const validateConfig: () => void;
export declare const logConfig: () => void;
export declare const isDevelopment: boolean, isProduction: boolean, isTest: boolean;
export default config;
//# sourceMappingURL=env.d.ts.map