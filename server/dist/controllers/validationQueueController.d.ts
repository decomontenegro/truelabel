import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare class ValidationQueueController {
    getQueue(req: AuthRequest, res: Response): Promise<Response>;
    createQueueEntry(req: AuthRequest, res: Response): Promise<Response>;
    assignValidation(req: AuthRequest, res: Response): Promise<Response>;
    updateStatus(req: AuthRequest, res: Response): Promise<Response>;
    getMetrics(req: AuthRequest, res: Response): Promise<Response>;
    getQueueEntry(req: AuthRequest, res: Response): Promise<Response>;
    getQueueHistory(req: AuthRequest, res: Response): Promise<Response>;
    cancelQueueEntry(req: AuthRequest, res: Response): Promise<Response>;
}
declare const _default: ValidationQueueController;
export default _default;
//# sourceMappingURL=validationQueueController.d.ts.map