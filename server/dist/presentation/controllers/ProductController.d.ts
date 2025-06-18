import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare class ProductController {
    private createProductUseCase;
    constructor();
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=ProductController.d.ts.map