import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const requireRole: (roles: string | string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=requireRole.d.ts.map