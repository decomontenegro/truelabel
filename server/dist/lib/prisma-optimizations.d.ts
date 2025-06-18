import { PrismaClient, Prisma } from '@prisma/client';
export declare const productQueries: {
    findWithFullDetails: (productId: string) => {
        where: {
            id: string;
        };
        include: {
            user: {
                select: {
                    id: boolean;
                    name: boolean;
                    email: boolean;
                };
            };
            validations: {
                where: {
                    status: {
                        in: string[];
                    };
                };
                orderBy: {
                    createdAt: string;
                };
                take: number;
                include: {
                    report: {
                        include: {
                            laboratory: {
                                select: {
                                    id: boolean;
                                    name: boolean;
                                    accreditation: boolean;
                                };
                            };
                        };
                    };
                };
            };
            seals: {
                select: {
                    id: boolean;
                    name: boolean;
                    category: boolean;
                    description: boolean;
                    imageUrl: boolean;
                    issuedBy: boolean;
                    validUntil: boolean;
                };
            };
            _count: {
                select: {
                    validations: boolean;
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
            sku: boolean;
            category: boolean;
            status: boolean;
            imageUrl: boolean;
            createdAt: boolean;
            user: {
                select: {
                    id: boolean;
                    name: boolean;
                    email: boolean;
                };
            };
            validations: {
                where: {
                    status: string;
                };
                select: {
                    id: boolean;
                    createdAt: boolean;
                };
                take: number;
                orderBy: {
                    createdAt: string;
                };
            };
            _count: {
                select: {
                    validations: boolean;
                    seals: boolean;
                };
            };
        };
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
                    user: {
                        select: {
                            id: boolean;
                            name: boolean;
                            email: boolean;
                        };
                    };
                };
            };
            report: {
                include: {
                    laboratory: boolean;
                };
            };
            validator: {
                select: {
                    id: boolean;
                    name: boolean;
                    email: boolean;
                    role: boolean;
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
                    user: boolean;
                    seals: boolean;
                };
            };
            report: {
                include: {
                    laboratory: boolean;
                };
            };
            validator: {
                select: {
                    name: boolean;
                    email: boolean;
                };
            };
        };
    };
};
export declare const searchQueries: {
    searchProducts: (searchTerm: string, filters?: {
        category?: string;
        status?: string;
        userId?: string;
    }) => {
        where: {
            AND: ({
                OR: ({
                    name: {
                        contains: string;
                        mode: "insensitive";
                    };
                    description?: undefined;
                    sku?: undefined;
                    brand?: undefined;
                } | {
                    description: {
                        contains: string;
                        mode: "insensitive";
                    };
                    name?: undefined;
                    sku?: undefined;
                    brand?: undefined;
                } | {
                    sku: {
                        contains: string;
                    };
                    name?: undefined;
                    description?: undefined;
                    brand?: undefined;
                } | {
                    brand: {
                        contains: string;
                        mode: "insensitive";
                    };
                    name?: undefined;
                    description?: undefined;
                    sku?: undefined;
                })[];
                category?: undefined;
                status?: undefined;
                userId?: undefined;
            } | {
                category: string;
                OR?: undefined;
                status?: undefined;
                userId?: undefined;
            } | {
                status: string;
                OR?: undefined;
                category?: undefined;
                userId?: undefined;
            } | {
                userId: string;
                OR?: undefined;
                category?: undefined;
                status?: undefined;
            })[];
        };
        include: {
            user: {
                select: {
                    name: boolean;
                    email: boolean;
                };
            };
            validations: {
                where: {
                    status: string;
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
}, "error" | "warn" | "info", import("@prisma/client/runtime/library").DefaultArgs>;
declare const _default: {
    productQueries: {
        findWithFullDetails: (productId: string) => {
            where: {
                id: string;
            };
            include: {
                user: {
                    select: {
                        id: boolean;
                        name: boolean;
                        email: boolean;
                    };
                };
                validations: {
                    where: {
                        status: {
                            in: string[];
                        };
                    };
                    orderBy: {
                        createdAt: string;
                    };
                    take: number;
                    include: {
                        report: {
                            include: {
                                laboratory: {
                                    select: {
                                        id: boolean;
                                        name: boolean;
                                        accreditation: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                seals: {
                    select: {
                        id: boolean;
                        name: boolean;
                        category: boolean;
                        description: boolean;
                        imageUrl: boolean;
                        issuedBy: boolean;
                        validUntil: boolean;
                    };
                };
                _count: {
                    select: {
                        validations: boolean;
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
                sku: boolean;
                category: boolean;
                status: boolean;
                imageUrl: boolean;
                createdAt: boolean;
                user: {
                    select: {
                        id: boolean;
                        name: boolean;
                        email: boolean;
                    };
                };
                validations: {
                    where: {
                        status: string;
                    };
                    select: {
                        id: boolean;
                        createdAt: boolean;
                    };
                    take: number;
                    orderBy: {
                        createdAt: string;
                    };
                };
                _count: {
                    select: {
                        validations: boolean;
                        seals: boolean;
                    };
                };
            };
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
                        user: {
                            select: {
                                id: boolean;
                                name: boolean;
                                email: boolean;
                            };
                        };
                    };
                };
                report: {
                    include: {
                        laboratory: boolean;
                    };
                };
                validator: {
                    select: {
                        id: boolean;
                        name: boolean;
                        email: boolean;
                        role: boolean;
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
                        user: boolean;
                        seals: boolean;
                    };
                };
                report: {
                    include: {
                        laboratory: boolean;
                    };
                };
                validator: {
                    select: {
                        name: boolean;
                        email: boolean;
                    };
                };
            };
        };
    };
    searchQueries: {
        searchProducts: (searchTerm: string, filters?: {
            category?: string;
            status?: string;
            userId?: string;
        }) => {
            where: {
                AND: ({
                    OR: ({
                        name: {
                            contains: string;
                            mode: "insensitive";
                        };
                        description?: undefined;
                        sku?: undefined;
                        brand?: undefined;
                    } | {
                        description: {
                            contains: string;
                            mode: "insensitive";
                        };
                        name?: undefined;
                        sku?: undefined;
                        brand?: undefined;
                    } | {
                        sku: {
                            contains: string;
                        };
                        name?: undefined;
                        description?: undefined;
                        brand?: undefined;
                    } | {
                        brand: {
                            contains: string;
                            mode: "insensitive";
                        };
                        name?: undefined;
                        description?: undefined;
                        sku?: undefined;
                    })[];
                    category?: undefined;
                    status?: undefined;
                    userId?: undefined;
                } | {
                    category: string;
                    OR?: undefined;
                    status?: undefined;
                    userId?: undefined;
                } | {
                    status: string;
                    OR?: undefined;
                    category?: undefined;
                    userId?: undefined;
                } | {
                    userId: string;
                    OR?: undefined;
                    category?: undefined;
                    status?: undefined;
                })[];
            };
            include: {
                user: {
                    select: {
                        name: boolean;
                        email: boolean;
                    };
                };
                validations: {
                    where: {
                        status: string;
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
    QueryPerformanceMonitor: typeof QueryPerformanceMonitor;
};
export default _default;
//# sourceMappingURL=prisma-optimizations.d.ts.map