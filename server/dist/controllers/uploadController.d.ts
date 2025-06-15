import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProductReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=uploadController.d.ts.map