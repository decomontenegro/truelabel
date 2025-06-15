"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductAnalytics = exports.getDashboardAnalytics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        const [totalProducts, totalReports, totalValidations, totalQRAccesses, recentProducts, recentReports, validationsByStatus, qrAccessesByDay] = await Promise.all([
            prisma.product.count({
                where: { userId }
            }),
            prisma.report.count({
                where: {
                    product: { userId }
                }
            }),
            prisma.validation.count({
                where: {
                    report: {
                        product: { userId }
                    }
                }
            }),
            prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM qr_code_accesses qr
        INNER JOIN products p ON p.qr_code = qr.qr_code
        WHERE p.user_id = ${userId}
        AND p.qr_code IS NOT NULL
      `.then(result => Number(result[0]?.count || 0)),
            prisma.product.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    status: true,
                    createdAt: true
                }
            }),
            prisma.report.findMany({
                where: {
                    product: { userId },
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    product: {
                        select: { name: true }
                    },
                    laboratory: {
                        select: { name: true }
                    }
                }
            }),
            prisma.validation.groupBy({
                by: ['status'],
                where: {
                    report: {
                        product: { userId }
                    }
                },
                _count: {
                    id: true
                }
            }),
            prisma.$queryRaw `
        SELECT
          DATE(accessed_at) as date,
          COUNT(*) as count
        FROM qr_code_accesses
        WHERE qr_code IN (
          SELECT qr_code FROM products
          WHERE user_id = ${userId} AND qr_code IS NOT NULL
        )
        AND accessed_at >= ${startDate}
        GROUP BY DATE(accessed_at)
        ORDER BY date DESC
        LIMIT 30
      `
        ]);
        const topProducts = await prisma.$queryRaw `
      SELECT
        p.id,
        p.name,
        p.brand,
        COUNT(qr.id) as access_count
      FROM products p
      LEFT JOIN qr_code_accesses qr ON p.qr_code = qr.qr_code
      WHERE p.user_id = ${userId}
      AND p.qr_code IS NOT NULL
      AND qr.accessed_at >= ${startDate}
      GROUP BY p.id, p.name, p.brand
      ORDER BY access_count DESC
      LIMIT 5
    `;
        const response = {
            overview: {
                totalProducts,
                totalReports,
                totalValidations,
                totalQRAccesses
            },
            recent: {
                products: recentProducts,
                reports: recentReports.map(report => ({
                    id: report.id,
                    productName: report.product.name,
                    laboratoryName: report.laboratory.name,
                    analysisType: report.analysisType,
                    isVerified: report.isVerified,
                    createdAt: report.createdAt
                }))
            },
            validations: {
                byStatus: validationsByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.id;
                    return acc;
                }, {})
            },
            qrAccesses: {
                byDay: qrAccessesByDay,
                topProducts
            },
            period: {
                days: daysAgo,
                startDate,
                endDate: new Date()
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar analytics:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const getProductAnalytics = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                userId
            }
        });
        if (!product) {
            return res.status(404).json({
                error: 'Produto não encontrado'
            });
        }
        const { period = '30' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        const [totalReports, totalValidations, qrAccesses, recentAccesses, accessesByDay, accessesByLocation] = await Promise.all([
            prisma.report.count({
                where: { productId }
            }),
            prisma.validation.count({
                where: {
                    report: { productId }
                }
            }),
            product.qrCode ? prisma.qRCodeAccess.count({
                where: {
                    qrCode: product.qrCode,
                    accessedAt: { gte: startDate }
                }
            }) : 0,
            product.qrCode ? prisma.qRCodeAccess.findMany({
                where: {
                    qrCode: product.qrCode
                },
                orderBy: { accessedAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    ipAddress: true,
                    location: true,
                    accessedAt: true
                }
            }) : [],
            product.qrCode ? prisma.$queryRaw `
        SELECT
          DATE(accessed_at) as date,
          COUNT(*) as count
        FROM qr_code_accesses
        WHERE qr_code = ${product.qrCode}
        AND accessed_at >= ${startDate}
        GROUP BY DATE(accessed_at)
        ORDER BY date DESC
      ` : [],
            product.qrCode ? prisma.qRCodeAccess.groupBy({
                by: ['location'],
                where: {
                    qrCode: product.qrCode,
                    location: { not: null },
                    accessedAt: { gte: startDate }
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 10
            }) : []
        ]);
        const reports = await prisma.report.findMany({
            where: { productId },
            include: {
                laboratory: {
                    select: {
                        name: true,
                        accreditation: true
                    }
                },
                validations: {
                    select: {
                        status: true,
                        validatedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const response = {
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                qrCode: product.qrCode,
                status: product.status
            },
            overview: {
                totalReports,
                totalValidations,
                qrAccesses
            },
            reports: reports.map(report => ({
                id: report.id,
                analysisType: report.analysisType,
                laboratory: report.laboratory,
                isVerified: report.isVerified,
                validationStatus: report.validations[0]?.status || 'PENDING',
                createdAt: report.createdAt
            })),
            qrAnalytics: product.qrCode ? {
                recentAccesses: recentAccesses.map(access => ({
                    id: access.id,
                    location: access.location,
                    accessedAt: access.accessedAt
                })),
                accessesByDay,
                accessesByLocation: accessesByLocation.map(item => ({
                    location: item.location,
                    count: item._count.id
                }))
            } : null,
            period: {
                days: daysAgo,
                startDate,
                endDate: new Date()
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar analytics do produto:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};
exports.getProductAnalytics = getProductAnalytics;
//# sourceMappingURL=analyticsController.js.map