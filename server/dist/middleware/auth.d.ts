import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response | void>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
export declare const requireBrandOrAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
export declare const requireLabOrAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
//# sourceMappingURL=auth.d.ts.map