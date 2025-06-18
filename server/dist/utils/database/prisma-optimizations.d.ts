import { PrismaClient, Prisma } from '@prisma/client';
export declare const productQueries: {
    findWithFullDetails: (productId: string) => {
        where: {
            id: string;
        };
        include: {
            brand: {
                select: {
                    id: boolean;
                    name: boolean;
                    logo: boolean;
                    website: boolean;
                };
            };
            validations: {
                where: {
                    status: {
                        in: string[];
                    };
                    validUntil: {
                        gt: Date;
                    };
                };
                orderBy: {
                    createdAt: string;
                };
                take: number;
                include: {
                    laboratory: {
                        select: {
                            id: boolean;
                            name: boolean;
                            accreditation: boolean;
                        };
                    };
                    labResults: {
                        select: {
                            id: boolean;
                            testType: boolean;
                            result: boolean;
                            unit: boolean;
                            reference: boolean;
                            passed: boolean;
                        };
                    };
                };
            };
            certifications: {
                where: {
                    verified: boolean;
                    OR: ({
                        expiresAt: null;
                    } | {
                        expiresAt: {
                            gt: Date;
                        };
                    })[];
                };
                select: {
                    id: boolean;
                    type: boolean;
                    number: boolean;
                    issuer: boolean;
                    issuedAt: boolean;
                    expiresAt: boolean;
                };
            };
            qrCodes: {
                where: {
                    isActive: boolean;
                };
                orderBy: {
                    createdAt: string;
                };
                take: number;
                select: {
                    id: boolean;
                    code: boolean;
                    shortUrl: boolean;
                    scanCount: boolean;
                };
            };
            _count: {
                select: {
                    validations: boolean;
                    qrCodes: boolean;
                    certifications: boolean;
                };
            };
        };
    };
    findManyOptimized: (params: {
        skip?: number;
        take?: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) => {
        skip: number | undefined;
        take: number | undefined;
        where: Prisma.ProductWhereInput | undefined;
        orderBy: Prisma.ProductOrderByWithRelationInput | undefined;
        select: {
            id: boolean;
            name: boolean;
            description: boolean;
            ean: boolean;
            category: boolean;
            status: boolean;
            images: boolean;
            createdAt: boolean;
            brand: {
                select: {
                    id: boolean;
                    name: boolean;
                    logo: boolean;
                };
            };
            validations: {
                where: {
                    status: string;
                    validUntil: {
                        gt: Date;
                    };
                };
                select: {
                    id: boolean;
                    validatedAt: boolean;
                    validUntil: boolean;
                };
                take: number;
                orderBy: {
                    validatedAt: string;
                };
            };
            _count: {
                select: {
                    validations: boolean;
                    qrCodes: boolean;
                };
            };
        };
    };
    getDashboardStats: (brandId?: string) => {
        where: {
            brandId: string;
        } | {
            brandId?: undefined;
        };
        select: {
            status: boolean;
            _count: boolean;
        };
        groupBy: string[];
    };
};
export declare const validationQueries: {
    findWithFullContext: (validationId: string) => {
        where: {
            id: string;
        };
        include: {
            product: {
                include: {
                    brand: {
                        select: {
                            id: boolean;
                            name: boolean;
                            email: boolean;
                        };
                    };
                };
            };
            laboratory: {
                select: {
                    id: boolean;
                    name: boolean;
                    email: boolean;
                    accreditation: boolean;
                    accreditationBody: boolean;
                };
            };
            labResults: {
                orderBy: {
                    createdAt: string;
                };
            };
            prescriber: {
                select: {
                    id: boolean;
                    name: boolean;
                    email: boolean;
                    role: boolean;
                };
            };
            auditLogs: {
                orderBy: {
                    createdAt: string;
                };
                take: number;
                select: {
                    action: boolean;
                    details: boolean;
                    createdAt: boolean;
                    user: {
                        select: {
                            name: boolean;
                            email: boolean;
                        };
                    };
                };
            };
        };
    };
    findManyForLaboratory: (laboratoryId: string, params: {
        skip?: number;
        take?: number;
        status?: string[];
    }) => {
        where: {
            status?: {
                in: string[];
            } | undefined;
            laboratoryId: string;
        };
        skip: number | undefined;
        take: number | undefined;
        select: {
            id: boolean;
            status: boolean;
            priority: boolean;
            createdAt: boolean;
            validatedAt: boolean;
            product: {
                select: {
                    id: boolean;
                    name: boolean;
                    ean: boolean;
                    brand: {
                        select: {
                            name: boolean;
                        };
                    };
                };
            };
            _count: {
                select: {
                    labResults: boolean;
                };
            };
        };
        orderBy: ({
            priority: string;
            createdAt?: undefined;
        } | {
            createdAt: string;
            priority?: undefined;
        })[];
    };
};
export declare const qrCodeQueries: {
    findWithAnalytics: (code: string, dateRange?: {
        start: Date;
        end: Date;
    }) => {
        where: {
            code: string;
        };
        include: {
            product: {
                select: {
                    id: boolean;
                    name: boolean;
                    status: boolean;
                    brand: {
                        select: {
                            name: boolean;
                        };
                    };
                };
            };
            scans: {
                where: {
                    createdAt: {
                        gte: Date;
                        lte: Date;
                    };
                } | {
                    createdAt?: undefined;
                };
                select: {
                    id: boolean;
                    ipAddress: boolean;
                    userAgent: boolean;
                    referrer: boolean;
                    location: boolean;
                    createdAt: boolean;
                };
                orderBy: {
                    createdAt: string;
                };
                take: number;
            };
            _count: {
                select: {
                    scans: boolean;
                };
            };
        };
    };
    findExistingCodes: (productIds: string[]) => {
        where: {
            productId: {
                in: string[];
            };
            isActive: boolean;
        };
        select: {
            productId: boolean;
            code: boolean;
            shortUrl: boolean;
        };
    };
};
export declare const brandQueries: {
    getDashboardData: (brandId: string, dateRange: {
        start: Date;
        end: Date;
    }) => {
        where: {
            id: string;
        };
        include: {
            products: {
                select: {
                    id: boolean;
                    status: boolean;
                    validations: {
                        where: {
                            createdAt: {
                                gte: Date;
                                lte: Date;
                            };
                        };
                        select: {
                            status: boolean;
                            createdAt: boolean;
                        };
                    };
                    qrCodes: {
                        where: {
                            isActive: boolean;
                        };
                        select: {
                            scanCount: boolean;
                            scans: {
                                where: {
                                    createdAt: {
                                        gte: Date;
                                        lte: Date;
                                    };
                                };
                                select: {
                                    id: boolean;
                                };
                            };
                        };
                    };
                    _count: {
                        select: {
                            validations: boolean;
                            qrCodes: boolean;
                        };
                    };
                };
            };
            _count: {
                select: {
                    products: boolean;
                };
            };
        };
    };
    findWithCounts: (brandId: string) => {
        where: {
            id: string;
        };
        include: {
            _count: {
                select: {
                    products: boolean;
                    users: boolean;
                };
            };
        };
    };
};
export declare const reportQueries: {
    getValidationReportData: (validationId: string) => {
        where: {
            id: string;
        };
        include: {
            product: {
                include: {
                    brand: boolean;
                    certifications: {
                        where: {
                            verified: boolean;
                        };
                    };
                };
            };
            laboratory: boolean;
            labResults: {
                orderBy: {
                    testType: string;
                };
            };
            prescriber: {
                select: {
                    name: boolean;
                    email: boolean;
                };
            };
        };
    };
    getMonthlyStats: (brandId: string, year: number, month: number) => {
        where: {
            brandId: string;
            createdAt: {
                gte: Date;
                lte: Date;
            };
        };
        select: {
            status: boolean;
            createdAt: boolean;
            validations: {
                select: {
                    status: boolean;
                    createdAt: boolean;
                    validatedAt: boolean;
                };
            };
            qrCodes: {
                select: {
                    scanCount: boolean;
                    scans: {
                        where: {
                            createdAt: {
                                gte: Date;
                                lte: Date;
                            };
                        };
                        select: {
                            id: boolean;
                            createdAt: boolean;
                        };
                    };
                };
            };
        };
    };
};
export declare const notificationQueries: {
    findUnreadOptimized: (userId: string, limit?: number) => {
        where: {
            userId: string;
            read: boolean;
        };
        select: {
            id: boolean;
            type: boolean;
            title: boolean;
            message: boolean;
            data: boolean;
            createdAt: boolean;
        };
        orderBy: {
            createdAt: string;
        };
        take: number;
    };
    markManyAsRead: (notificationIds: string[]) => {
        where: {
            id: {
                in: string[];
            };
        };
        data: {
            read: boolean;
            readAt: Date;
        };
    };
};
export declare const searchQueries: {
    searchProducts: (searchTerm: string, filters?: {
        category?: string;
        status?: string;
        brandId?: string;
    }) => {
        where: {
            AND: ({
                OR: ({
                    name: {
                        contains: string;
                        mode: "insensitive";
                    };
                    description?: undefined;
                    ean?: undefined;
                    brand?: undefined;
                } | {
                    description: {
                        contains: string;
                        mode: "insensitive";
                    };
                    name?: undefined;
                    ean?: undefined;
                    brand?: undefined;
                } | {
                    ean: {
                        contains: string;
                    };
                    name?: undefined;
                    description?: undefined;
                    brand?: undefined;
                } | {
                    brand: {
                        name: {
                            contains: string;
                            mode: "insensitive";
                        };
                    };
                    name?: undefined;
                    description?: undefined;
                    ean?: undefined;
                })[];
                category?: undefined;
                status?: undefined;
                brandId?: undefined;
            } | {
                category: string;
                OR?: undefined;
                status?: undefined;
                brandId?: undefined;
            } | {
                status: string;
                OR?: undefined;
                category?: undefined;
                brandId?: undefined;
            } | {
                brandId: string;
                OR?: undefined;
                category?: undefined;
                status?: undefined;
            })[];
        };
        include: {
            brand: {
                select: {
                    name: boolean;
                    logo: boolean;
                };
            };
            validations: {
                where: {
                    status: string;
                    validUntil: {
                        gt: Date;
                    };
                };
                select: {
                    id: boolean;
                };
                take: number;
            };
        };
        take: number;
    };
};
export declare const batchOperations: {
    createManyValidations: (prisma: PrismaClient, validations: Array<{
        productId: string;
        laboratoryId: string;
        tests: string[];
        priority?: string;
    }>) => Promise<{
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
    updateManyProductStatus: (prisma: PrismaClient, productIds: string[], status: string) => Promise<Prisma.BatchPayload>;
};
export declare class QueryPerformanceMonitor {
    static measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T>;
}
export declare const prismaOptimizationMiddleware: Prisma.Middleware;
export declare const optimizedPrismaClient: () => PrismaClient<{
    log: ({
        level: "error";
        emit: "event";
    } | {
        level: "warn";
        emit: "event";
    } | {
        level: "info";
        emit: "event";
    })[];
    datasources: {
        db: {
            url: string | undefined;
        };
    };
}, "error" | "warn" | "info", import("@prisma/client/runtime/library").DefaultArgs>;
declare const _default: {
    productQueries: {
        findWithFullDetails: (productId: string) => {
            where: {
                id: string;
            };
            include: {
                brand: {
                    select: {
                        id: boolean;
                        name: boolean;
                        logo: boolean;
                        website: boolean;
                    };
                };
                validations: {
                    where: {
                        status: {
                            in: string[];
                        };
                        validUntil: {
                            gt: Date;
                        };
                    };
                    orderBy: {
                        createdAt: string;
                    };
                    take: number;
                    include: {
                        laboratory: {
                            select: {
                                id: boolean;
                                name: boolean;
                                accreditation: boolean;
                            };
                        };
                        labResults: {
                            select: {
                                id: boolean;
                                testType: boolean;
                                result: boolean;
                                unit: boolean;
                                reference: boolean;
                                passed: boolean;
                            };
                        };
                    };
                };
                certifications: {
                    where: {
                        verified: boolean;
                        OR: ({
                            expiresAt: null;
                        } | {
                            expiresAt: {
                                gt: Date;
                            };
                        })[];
                    };
                    select: {
                        id: boolean;
                        type: boolean;
                        number: boolean;
                        issuer: boolean;
                        issuedAt: boolean;
                        expiresAt: boolean;
                    };
                };
                qrCodes: {
                    where: {
                        isActive: boolean;
                    };
                    orderBy: {
                        createdAt: string;
                    };
                    take: number;
                    select: {
                        id: boolean;
                        code: boolean;
                        shortUrl: boolean;
                        scanCount: boolean;
                    };
                };
                _count: {
                    select: {
                        validations: boolean;
                        qrCodes: boolean;
                        certifications: boolean;
                    };
                };
            };
        };
        findManyOptimized: (params: {
            skip?: number;
            take?: number;
            where?: Prisma.ProductWhereInput;
            orderBy?: Prisma.ProductOrderByWithRelationInput;
        }) => {
            skip: number | undefined;
            take: number | undefined;
            where: Prisma.ProductWhereInput | undefined;
            orderBy: Prisma.ProductOrderByWithRelationInput | undefined;
            select: {
                id: boolean;
                name: boolean;
                description: boolean;
                ean: boolean;
                category: boolean;
                status: boolean;
                images: boolean;
                createdAt: boolean;
                brand: {
                    select: {
                        id: boolean;
                        name: boolean;
                        logo: boolean;
                    };
                };
                validations: {
                    where: {
                        status: string;
                        validUntil: {
                            gt: Date;
                        };
                    };
                    select: {
                        id: boolean;
                        validatedAt: boolean;
                        validUntil: boolean;
                    };
                    take: number;
                    orderBy: {
                        validatedAt: string;
                    };
                };
                _count: {
                    select: {
                        validations: boolean;
                        qrCodes: boolean;
                    };
                };
            };
        };
        getDashboardStats: (brandId?: string) => {
            where: {
                brandId: string;
            } | {
                brandId?: undefined;
            };
            select: {
                status: boolean;
                _count: boolean;
            };
            groupBy: string[];
        };
    };
    validationQueries: {
        findWithFullContext: (validationId: string) => {
            where: {
                id: string;
            };
            include: {
                product: {
                    include: {
                        brand: {
                            select: {
                                id: boolean;
                                name: boolean;
                                email: boolean;
                            };
                        };
                    };
                };
                laboratory: {
                    select: {
                        id: boolean;
                        name: boolean;
                        email: boolean;
                        accreditation: boolean;
                        accreditationBody: boolean;
                    };
                };
                labResults: {
                    orderBy: {
                        createdAt: string;
                    };
                };
                prescriber: {
                    select: {
                        id: boolean;
                        name: boolean;
                        email: boolean;
                        role: boolean;
                    };
                };
                auditLogs: {
                    orderBy: {
                        createdAt: string;
                    };
                    take: number;
                    select: {
                        action: boolean;
                        details: boolean;
                        createdAt: boolean;
                        user: {
                            select: {
                                name: boolean;
                                email: boolean;
                            };
                        };
                    };
                };
            };
        };
        findManyForLaboratory: (laboratoryId: string, params: {
            skip?: number;
            take?: number;
            status?: string[];
        }) => {
            where: {
                status?: {
                    in: string[];
                } | undefined;
                laboratoryId: string;
            };
            skip: number | undefined;
            take: number | undefined;
            select: {
                id: boolean;
                status: boolean;
                priority: boolean;
                createdAt: boolean;
                validatedAt: boolean;
                product: {
                    select: {
                        id: boolean;
                        name: boolean;
                        ean: boolean;
                        brand: {
                            select: {
                                name: boolean;
                            };
                        };
                    };
                };
                _count: {
                    select: {
                        labResults: boolean;
                    };
                };
            };
            orderBy: ({
                priority: string;
                createdAt?: undefined;
            } | {
                createdAt: string;
                priority?: undefined;
            })[];
        };
    };
    qrCodeQueries: {
        findWithAnalytics: (code: string, dateRange?: {
            start: Date;
            end: Date;
        }) => {
            where: {
                code: string;
            };
            include: {
                product: {
                    select: {
                        id: boolean;
                        name: boolean;
                        status: boolean;
                        brand: {
                            select: {
                                name: boolean;
                            };
                        };
                    };
                };
                scans: {
                    where: {
                        createdAt: {
                            gte: Date;
                            lte: Date;
                        };
                    } | {
                        createdAt?: undefined;
                    };
                    select: {
                        id: boolean;
                        ipAddress: boolean;
                        userAgent: boolean;
                        referrer: boolean;
                        location: boolean;
                        createdAt: boolean;
                    };
                    orderBy: {
                        createdAt: string;
                    };
                    take: number;
                };
                _count: {
                    select: {
                        scans: boolean;
                    };
                };
            };
        };
        findExistingCodes: (productIds: string[]) => {
            where: {
                productId: {
                    in: string[];
                };
                isActive: boolean;
            };
            select: {
                productId: boolean;
                code: boolean;
                shortUrl: boolean;
            };
        };
    };
    brandQueries: {
        getDashboardData: (brandId: string, dateRange: {
            start: Date;
            end: Date;
        }) => {
            where: {
                id: string;
            };
            include: {
                products: {
                    select: {
                        id: boolean;
                        status: boolean;
                        validations: {
                            where: {
                                createdAt: {
                                    gte: Date;
                                    lte: Date;
                                };
                            };
                            select: {
                                status: boolean;
                                createdAt: boolean;
                            };
                        };
                        qrCodes: {
                            where: {
                                isActive: boolean;
                            };
                            select: {
                                scanCount: boolean;
                                scans: {
                                    where: {
                                        createdAt: {
                                            gte: Date;
                                            lte: Date;
                                        };
                                    };
                                    select: {
                                        id: boolean;
                                    };
                                };
                            };
                        };
                        _count: {
                            select: {
                                validations: boolean;
                                qrCodes: boolean;
                            };
                        };
                    };
                };
                _count: {
                    select: {
                        products: boolean;
                    };
                };
            };
        };
        findWithCounts: (brandId: string) => {
            where: {
                id: string;
            };
            include: {
                _count: {
                    select: {
                        products: boolean;
                        users: boolean;
                    };
                };
            };
        };
    };
    reportQueries: {
        getValidationReportData: (validationId: string) => {
            where: {
                id: string;
            };
            include: {
                product: {
                    include: {
                        brand: boolean;
                        certifications: {
                            where: {
                                verified: boolean;
                            };
                        };
                    };
                };
                laboratory: boolean;
                labResults: {
                    orderBy: {
                        testType: string;
                    };
                };
                prescriber: {
                    select: {
                        name: boolean;
                        email: boolean;
                    };
                };
            };
        };
        getMonthlyStats: (brandId: string, year: number, month: number) => {
            where: {
                brandId: string;
                createdAt: {
                    gte: Date;
                    lte: Date;
                };
            };
            select: {
                status: boolean;
                createdAt: boolean;
                validations: {
                    select: {
                        status: boolean;
                        createdAt: boolean;
                        validatedAt: boolean;
                    };
                };
                qrCodes: {
                    select: {
                        scanCount: boolean;
                        scans: {
                            where: {
                                createdAt: {
                                    gte: Date;
                                    lte: Date;
                                };
                            };
                            select: {
                                id: boolean;
                                createdAt: boolean;
                            };
                        };
                    };
                };
            };
        };
    };
    notificationQueries: {
        findUnreadOptimized: (userId: string, limit?: number) => {
            where: {
                userId: string;
                read: boolean;
            };
            select: {
                id: boolean;
                type: boolean;
                title: boolean;
                message: boolean;
                data: boolean;
                createdAt: boolean;
            };
            orderBy: {
                createdAt: string;
            };
            take: number;
        };
        markManyAsRead: (notificationIds: string[]) => {
            where: {
                id: {
                    in: string[];
                };
            };
            data: {
                read: boolean;
                readAt: Date;
            };
        };
    };
    searchQueries: {
        searchProducts: (searchTerm: string, filters?: {
            category?: string;
            status?: string;
            brandId?: string;
        }) => {
            where: {
                AND: ({
                    OR: ({
                        name: {
                            contains: string;
                            mode: "insensitive";
                        };
                        description?: undefined;
                        ean?: undefined;
                        brand?: undefined;
                    } | {
                        description: {
                            contains: string;
                            mode: "insensitive";
                        };
                        name?: undefined;
                        ean?: undefined;
                        brand?: undefined;
                    } | {
                        ean: {
                            contains: string;
                        };
                        name?: undefined;
                        description?: undefined;
                        brand?: undefined;
                    } | {
                        brand: {
                            name: {
                                contains: string;
                                mode: "insensitive";
                            };
                        };
                        name?: undefined;
                        description?: undefined;
                        ean?: undefined;
                    })[];
                    category?: undefined;
                    status?: undefined;
                    brandId?: undefined;
                } | {
                    category: string;
                    OR?: undefined;
                    status?: undefined;
                    brandId?: undefined;
                } | {
                    status: string;
                    OR?: undefined;
                    category?: undefined;
                    brandId?: undefined;
                } | {
                    brandId: string;
                    OR?: undefined;
                    category?: undefined;
                    status?: undefined;
                })[];
            };
            include: {
                brand: {
                    select: {
                        name: boolean;
                        logo: boolean;
                    };
                };
                validations: {
                    where: {
                        status: string;
                        validUntil: {
                            gt: Date;
                        };
                    };
                    select: {
                        id: boolean;
                    };
                    take: number;
                };
            };
            take: number;
        };
    };
    batchOperations: {
        createManyValidations: (prisma: PrismaClient, validations: Array<{
            productId: string;
            laboratoryId: string;
            tests: string[];
            priority?: string;
        }>) => Promise<{
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
        updateManyProductStatus: (prisma: PrismaClient, productIds: string[], status: string) => Promise<Prisma.BatchPayload>;
    };
    QueryPerformanceMonitor: typeof QueryPerformanceMonitor;
};
export default _default;
//# sourceMappingURL=prisma-optimizations.d.ts.map