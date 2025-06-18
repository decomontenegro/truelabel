export interface ProductDTO {
    id: string;
    name: string;
    description?: string;
    ean: string;
    category: string;
    status: string;
    brandId: string;
    brandName?: string;
    claims: string[];
    ingredients: string[];
    nutritionalInfo?: Record<string, any>;
    images: string[];
    validations?: {
        id: string;
        status: string;
        validatedAt?: Date;
        validUntil?: Date;
        laboratoryName?: string;
    }[];
    qrCode?: {
        code: string;
        url: string;
        scanCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=ProductDTO.d.ts.map