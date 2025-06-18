import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-errors';
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const setupErrorBoundaries: () => void;
export declare const timeoutHandler: (timeout?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const formatValidationErrors: (errors: any[]) => AppError;
export declare const errorRecovery: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Response {
            error: (error: Error | AppError, statusCode?: number) => void;
            validationError: (errors: Array<{
                field: string;
                message: string;
            }>) => void;
            notFound: (resource: string, identifier?: string | number) => void;
            forbidden: (message?: string) => void;
        }
    }
}
export declare const gracefulShutdown: (server: any) => void;
//# sourceMappingURL=error-handler.middleware.d.ts.map