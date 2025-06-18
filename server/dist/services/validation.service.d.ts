export interface ValidationFilter {
    status?: string[];
    laboratoryId?: string;
    productId?: string;
    priority?: string;
}
export interface CreateValidationData {
    productId: string;
    laboratoryId: string;
    tests: string[];
    priority?: string;
    notes?: string;
}
export declare class ValidationService {
    static getValidations(filters: ValidationFilter, pagination: {
        page: number;
        limit: number;
    }, userRole?: string, userId?: string): Promise<{
        validations: {
            type: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            claimsValidated: string | null;
            summary: string | null;
            notes: string | null;
            validatedAt: Date | null;
            productId: string;
            reportId: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasMore: boolean;
        };
    }>;
    static getValidationDetails(validationId: string): Promise<{} | null>;
    static createValidation(data: CreateValidationData, requestedBy: string): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        claimsValidated: string | null;
        summary: string | null;
        notes: string | null;
        validatedAt: Date | null;
        productId: string;
        reportId: string | null;
    }>;
    static createBatchValidations(validations: CreateValidationData[], requestedBy: string): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        claimsValidated: string | null;
        summary: string | null;
        notes: string | null;
        validatedAt: Date | null;
        productId: string;
        reportId: string | null;
    }[]>;
    static updateValidationStatus(validationId: string, status: string, userId: string, details?: any): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        claimsValidated: string | null;
        summary: string | null;
        notes: string | null;
        validatedAt: Date | null;
        productId: string;
        reportId: string | null;
    }>;
    static addLabResults(validationId: string, results: Array<{
        testType: string;
        result: string;
        unit?: string;
        reference?: string;
        passed: boolean;
        notes?: string;
    }>, userId: string): Promise<any>;
    static getValidationStats(filters?: {
        laboratoryId?: string;
        brandId?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<{}>;
}
export default ValidationService;
//# sourceMappingURL=validation.service.d.ts.map