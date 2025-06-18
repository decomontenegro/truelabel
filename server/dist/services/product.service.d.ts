export interface ProductFilter {
    search?: string;
    category?: string;
    status?: string;
    brandId?: string;
}
export interface PaginationParams {
    page: number;
    limit: number;
}
export declare class ProductService {
    static getProducts(filters: ProductFilter, pagination: PaginationParams, userId?: string, isAdmin?: boolean): Promise<{
        products: {
            status: string;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            brand: string;
            category: string;
            description: string | null;
            sku: string;
            batchNumber: string | null;
            nutritionalInfo: string | null;
            claims: string | null;
            imageUrl: string | null;
            qrCode: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasMore: boolean;
        };
    }>;
    static getProductDetails(productId: string): Promise<{} | null>;
    static getDashboardStats(brandId?: string): Promise<{}>;
    static searchProducts(searchTerm: string, filters?: ProductFilter): Promise<{
        status: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        brand: string;
        category: string;
        description: string | null;
        sku: string;
        batchNumber: string | null;
        nutritionalInfo: string | null;
        claims: string | null;
        imageUrl: string | null;
        qrCode: string | null;
    }[]>;
    static createProduct(data: any, userId: string): Promise<{
        status: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        brand: string;
        category: string;
        description: string | null;
        sku: string;
        batchNumber: string | null;
        nutritionalInfo: string | null;
        claims: string | null;
        imageUrl: string | null;
        qrCode: string | null;
    }>;
    static updateProduct(productId: string, data: any, userId: string): Promise<{
        status: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        brand: string;
        category: string;
        description: string | null;
        sku: string;
        batchNumber: string | null;
        nutritionalInfo: string | null;
        claims: string | null;
        imageUrl: string | null;
        qrCode: string | null;
    }>;
    static batchUpdateStatus(productIds: string[], status: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static getProductValidationHistory(productId: string): Promise<{}>;
}
export default ProductService;
//# sourceMappingURL=product.service.d.ts.map