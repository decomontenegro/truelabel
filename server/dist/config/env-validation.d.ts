import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DATABASE_URL: z.ZodUnion<[z.ZodString, z.ZodString]>;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    BCRYPT_ROUNDS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    CORS_ORIGIN: z.ZodEffects<z.ZodString, string[], string>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    REDIS_ENABLED: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    UPLOAD_DIR: z.ZodDefault<z.ZodString>;
    MAX_FILE_SIZE: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASS: z.ZodOptional<z.ZodString>;
    EMAIL_FROM: z.ZodOptional<z.ZodString>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    AWS_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    AWS_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
    AWS_REGION: z.ZodDefault<z.ZodString>;
    S3_BUCKET: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string[];
    MAX_FILE_SIZE: number;
    BCRYPT_ROUNDS: number;
    REDIS_ENABLED: boolean;
    AWS_REGION: string;
    UPLOAD_DIR: string;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    REDIS_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    EMAIL_FROM?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    S3_BUCKET?: string | undefined;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    MAX_FILE_SIZE?: string | undefined;
    BCRYPT_ROUNDS?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: string | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    REDIS_ENABLED?: string | undefined;
    REDIS_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    EMAIL_FROM?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_REGION?: string | undefined;
    UPLOAD_DIR?: string | undefined;
    S3_BUCKET?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function validateEnv(): EnvConfig;
export declare const env: {
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string[];
    MAX_FILE_SIZE: number;
    BCRYPT_ROUNDS: number;
    REDIS_ENABLED: boolean;
    AWS_REGION: string;
    UPLOAD_DIR: string;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    REDIS_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    EMAIL_FROM?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    S3_BUCKET?: string | undefined;
};
export declare const isDevelopment: boolean;
export declare const isTest: boolean;
export declare const isProduction: boolean;
export declare const config: {
    readonly server: {
        readonly port: number;
        readonly env: "development" | "production" | "test";
    };
    readonly database: {
        readonly url: string;
        readonly logging: boolean;
    };
    readonly auth: {
        readonly jwtSecret: string;
        readonly jwtExpiresIn: string;
        readonly bcryptRounds: number;
    };
    readonly cors: {
        readonly origin: string[];
        readonly credentials: true;
    };
    readonly redis: {
        readonly enabled: boolean;
        readonly url: string | undefined;
    };
    readonly storage: {
        readonly uploadDir: string;
        readonly maxFileSize: number;
    };
    readonly email: {
        readonly enabled: boolean;
        readonly smtp: {
            readonly host: string | undefined;
            readonly port: number | undefined;
            readonly auth: {
                readonly user: string | undefined;
                readonly pass: string | undefined;
            };
        };
        readonly from: string | undefined;
    };
    readonly external: {
        readonly sentry: {
            readonly enabled: boolean;
            readonly dsn: string | undefined;
        };
        readonly aws: {
            readonly enabled: boolean;
            readonly accessKeyId: string | undefined;
            readonly secretAccessKey: string | undefined;
            readonly region: string;
            readonly s3Bucket: string | undefined;
        };
        readonly openai: {
            readonly enabled: boolean;
            readonly apiKey: string | undefined;
        };
    };
};
export default config;
//# sourceMappingURL=env-validation.d.ts.map