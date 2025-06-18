import { ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizers: {
    sanitizeString: (value: string) => string;
    sanitizeHtml: (value: string) => string;
    sanitizeFilename: (filename: string) => string;
    sanitizeUrl: (url: string) => string;
    sanitizePhone: (phone: string) => string;
};
export declare const validators: {
    userRegistration: ValidationChain[];
    productCreation: ValidationChain[];
    validationRequest: ValidationChain[];
    fileUpload: ValidationChain[];
    searchQuery: ValidationChain[];
    uuidParam: (paramName: string) => ValidationChain[];
    dateRange: ValidationChain[];
    brazilianDocuments: ValidationChain[];
};
export declare const customValidators: {
    isBrazilianPhone: (value: string) => boolean;
    isStrongPassword: (password: string) => boolean;
    isSafeUrl: (url: string) => boolean;
    isValidJSON: (value: string) => boolean;
    isBase64: (value: string) => boolean;
};
export declare const sanitizeInputs: (req: Request, res: Response, next: NextFunction) => void;
export declare const validate: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validation.utils.d.ts.map