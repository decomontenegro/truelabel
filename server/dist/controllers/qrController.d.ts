import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const generateQRCode: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const validateQRCode: (req: Request, res: Response) => Promise<Response>;
export declare const getQRCodeAccesses: (req: AuthRequest, res: Response) => Promise<Response>;
//# sourceMappingURL=qrController.d.ts.map