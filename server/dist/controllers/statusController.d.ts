import { Request, Response } from 'express';
export declare class StatusController {
    getStatus(req: Request, res: Response): Promise<void>;
    private checkAllServices;
    private checkDatabase;
    private checkRedis;
    private checkAPI;
    private checkQRService;
    private checkAIService;
    private getSystemMetrics;
    private getRecentIncidents;
    private calculateOverallStatus;
    healthCheck(req: Request, res: Response): Promise<void>;
    subscribeWebhook(req: Request, res: Response): Promise<void>;
}
export declare const statusController: StatusController;
//# sourceMappingURL=statusController.d.ts.map