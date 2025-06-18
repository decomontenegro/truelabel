"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryExamples = void 0;
const client_1 = require("@prisma/client");
const prisma_optimizations_1 = require("./prisma-optimizations");
const prisma = new client_1.PrismaClient();
async function badGetProductsWithValidations() {
    const products = await prisma.product.findMany();
    for (const product of products) {
        const validations = await prisma.validation.findMany({
            where: { productId: product.id }
        });
        product.validations = validations;
    }
    return products;
}
async function goodGetProductsWithValidations() {
    return await prisma.product.findMany({
        include: {
            validations: {
                where: {
                    status: 'VALIDATED',
                    validUntil: { gt: new Date() }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
}
async function badGetDashboardData(brandId) {
    const products = await prisma.product.count({ where: { brandId } });
    const validations = await prisma.validation.count({
        where: { product: { brandId } }
    });
    const pendingValidations = await prisma.validation.count({
        where: {
            product: { brandId },
            status: 'PENDING'
        }
    });
    const qrScans = await prisma.qRCodeScan.count({
        where: { qrCode: { product: { brandId } } }
    });
    return { products, validations, pendingValidations, qrScans };
}
async function goodGetDashboardData(brandId) {
    const [productStats, validationStats, qrStats] = await Promise.all([
        prisma.product.groupBy({
            by: ['status'],
            where: { brandId },
            _count: true
        }),
        prisma.validation.groupBy({
            by: ['status'],
            where: { product: { brandId } },
            _count: true
        }),
        prisma.qRCode.aggregate({
            where: { product: { brandId } },
            _sum: { scanCount: true },
            _count: true
        })
    ]);
    return {
        products: productStats.reduce((acc, stat) => acc + stat._count, 0),
        productsByStatus: productStats,
        validations: validationStats.reduce((acc, stat) => acc + stat._count, 0),
        validationsByStatus: validationStats,
        totalQRScans: qrStats._sum.scanCount || 0,
        totalQRCodes: qrStats._count
    };
}
async function badGetProductDetails(productId) {
    return await prisma.product.findUnique({
        where: { id: productId },
        include: {
            brand: true,
            validations: true,
            certifications: true,
            qrCodes: {
                include: {
                    scans: true
                }
            }
        }
    });
}
async function goodGetProductDetails(productId) {
    return await prisma_optimizations_1.QueryPerformanceMonitor.measureQuery('getProductDetails', () => prisma.product.findUnique(prisma_optimizations_1.productQueries.findWithFullDetails(productId)));
}
async function badSearchProducts(searchTerm) {
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: searchTerm } },
                { description: { contains: searchTerm } }
            ]
        }
    });
    return products.filter(p => p.status === 'VALIDATED');
}
async function goodSearchProducts(searchTerm) {
    return await prisma.product.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                { status: 'VALIDATED' }
            ]
        },
        select: {
            id: true,
            name: true,
            description: true,
            category: true,
            brand: {
                select: { name: true, logo: true }
            }
        },
        take: 20
    });
}
async function badCreateValidationWithNotification(data) {
    try {
        const validation = await prisma.validation.create({ data });
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: 'VALIDATION_CREATED',
                title: 'New Validation',
                message: `Validation ${validation.id} created`
            }
        });
        return { validation, notification };
    }
    catch (error) {
        throw error;
    }
}
async function goodCreateValidationWithNotification(data) {
    return await prisma.$transaction(async (tx) => {
        const validation = await tx.validation.create({ data });
        const notification = await tx.notification.create({
            data: {
                userId: data.userId,
                type: 'VALIDATION_CREATED',
                title: 'New Validation',
                message: `Validation ${validation.id} created`,
                data: { validationId: validation.id }
            }
        });
        await tx.product.update({
            where: { id: data.productId },
            data: { status: 'IN_VALIDATION' }
        });
        return { validation, notification };
    });
}
async function badGetPaginatedProducts(page, limit) {
    const allProducts = await prisma.product.findMany({
        include: { validations: true }
    });
    const total = allProducts.length;
    const start = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(start, start + limit);
    return {
        data: paginatedProducts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
async function goodGetPaginatedProducts(page, limit) {
    const [data, total] = await Promise.all([
        prisma.product.findMany({
            skip: (page - 1) * limit,
            take: limit,
            include: {
                brand: {
                    select: { name: true, logo: true }
                },
                _count: {
                    select: { validations: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count()
    ]);
    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
    };
}
async function badGetUserPermissions(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: true
                }
            }
        }
    });
    return user?.role?.permissions || [];
}
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
async function goodGetUserPermissions(userId) {
    const cached = permissionCache.get(userId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.permissions;
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: {
                select: {
                    permissions: {
                        select: {
                            action: true,
                            resource: true
                        }
                    }
                }
            }
        }
    });
    const permissions = user?.role?.permissions || [];
    permissionCache.set(userId, { permissions, timestamp: now });
    return permissions;
}
async function badExportAllProducts(brandId) {
    const products = await prisma.product.findMany({
        where: { brandId },
        include: {
            validations: true,
            certifications: true,
            qrCodes: true
        }
    });
    return products;
}
async function* goodExportAllProducts(brandId) {
    const batchSize = 100;
    let cursor;
    while (true) {
        const products = await prisma.product.findMany({
            where: { brandId },
            take: batchSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                ean: true,
                category: true,
                status: true,
                createdAt: true
            }
        });
        if (products.length === 0)
            break;
        yield products;
        cursor = products[products.length - 1].id;
        if (products.length < batchSize)
            break;
    }
}
async function badCalculateMonthlyStats(brandId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const products = await prisma.product.findMany({
        where: {
            brandId,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            validations: true,
            qrCodes: {
                include: {
                    scans: true
                }
            }
        }
    });
    const stats = {
        totalProducts: products.length,
        validatedProducts: products.filter(p => p.status === 'VALIDATED').length,
        totalValidations: products.reduce((sum, p) => sum + p.validations.length, 0),
        totalScans: products.reduce((sum, p) => sum + p.qrCodes.reduce((qrSum, qr) => qrSum + qr.scans.length, 0), 0)
    };
    return stats;
}
async function goodCalculateMonthlyStats(brandId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const [productStats, validationStats, scanStats] = await Promise.all([
        prisma.product.aggregate({
            where: {
                brandId,
                createdAt: { gte: startDate, lte: endDate }
            },
            _count: {
                id: true
            },
            _sum: {
                status: true
            }
        }),
        prisma.validation.aggregate({
            where: {
                product: { brandId },
                createdAt: { gte: startDate, lte: endDate }
            },
            _count: {
                id: true
            }
        }),
        prisma.$queryRaw `
      SELECT COUNT(*) as "totalScans"
      FROM "QRCodeScan" s
      JOIN "QRCode" q ON s."qrCodeId" = q.id
      JOIN "Product" p ON q."productId" = p.id
      WHERE p."brandId" = ${brandId}
      AND s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
    `
    ]);
    return {
        totalProducts: productStats._count.id,
        totalValidations: validationStats._count.id,
        totalScans: Number(scanStats[0]?.totalScans || 0)
    };
}
exports.QueryExamples = {
    bad: {
        badGetProductsWithValidations,
        badGetDashboardData,
        badGetProductDetails,
        badSearchProducts,
        badCreateValidationWithNotification,
        badGetPaginatedProducts,
        badGetUserPermissions,
        badExportAllProducts,
        badCalculateMonthlyStats
    },
    good: {
        goodGetProductsWithValidations,
        goodGetDashboardData,
        goodGetProductDetails,
        goodSearchProducts,
        goodCreateValidationWithNotification,
        goodGetPaginatedProducts,
        goodGetUserPermissions,
        goodExportAllProducts,
        goodCalculateMonthlyStats
    }
};
//# sourceMappingURL=query-examples.js.map