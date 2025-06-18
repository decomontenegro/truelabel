import { Request, Response } from 'express';
export declare const createRateLimiter: (windowMs: number, max: number, message?: string) => import("express-rate-limit").RateLimitRequestHandler;
export declare const rateLimiters: {
    general: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
    validation: import("express-rate-limit").RateLimitRequestHandler;
    upload: import("express-rate-limit").RateLimitRequestHandler;
    reports: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const mongoSanitizer: import("express").Handler;
export declare const parameterPollutionPrevention: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const responseCompression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const customSecurityChecks: (req: Request, res: Response, next: Function) => void;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: Function) => any;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
    optionsSuccessStatus: number;
};
export declare const validateApiKey: (req: Request, res: Response, next: Function) => void;
export declare const requestSizeLimits: {
    json: string;
    urlencoded: string;
    raw: string;
};
export declare const fileUploadRestrictions: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
};
//# sourceMappingURL=security.middleware.d.ts.map