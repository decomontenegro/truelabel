import { Request, Response, NextFunction } from 'express';
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const speedLimiter: any;
export declare const sanitizeRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
};
export declare const validateContentType: (allowedTypes: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipWhitelist: (whitelist: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sessionSecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const fileUploadSecurity: {
    limits: {
        fileSize: number;
        files: number;
    };
    fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => any;
};
declare const _default: {
    securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    speedLimiter: any;
    sanitizeRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    corsOptions: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    validateContentType: (allowedTypes: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    requestId: (req: Request, res: Response, next: NextFunction) => void;
    ipWhitelist: (whitelist: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    sessionSecurity: (req: Request, res: Response, next: NextFunction) => void;
    fileUploadSecurity: {
        limits: {
            fileSize: number;
            files: number;
        };
        fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => any;
    };
};
export default _default;
//# sourceMappingURL=security.d.ts.map