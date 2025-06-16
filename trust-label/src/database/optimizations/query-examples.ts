import { PrismaClient } from '@prisma/client';
import { 
  productQueries, 
  validationQueries, 
  QueryPerformanceMonitor 
} from './prisma-optimizations';

const prisma = new PrismaClient();

/**
 * Examples of optimized queries to prevent N+1 problems
 */

// ❌ BAD: N+1 Query Problem
async function badGetProductsWithValidations() {
  // This creates N+1 queries: 1 for products + N for each product's validations
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    const validations = await prisma.validation.findMany({
      where: { productId: product.id }
    });
    product.validations = validations;
  }
  
  return products;
}

// ✅ GOOD: Single query with includes
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

// ❌ BAD: Multiple queries for dashboard
async function badGetDashboardData(brandId: string) {
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

// ✅ GOOD: Single aggregated query
async function goodGetDashboardData(brandId: string) {
  const [productStats, validationStats, qrStats] = await Promise.all([
    // Product statistics
    prisma.product.groupBy({
      by: ['status'],
      where: { brandId },
      _count: true
    }),
    
    // Validation statistics
    prisma.validation.groupBy({
      by: ['status'],
      where: { product: { brandId } },
      _count: true
    }),
    
    // QR scan statistics
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

// ❌ BAD: Loading unnecessary data
async function badGetProductDetails(productId: string) {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: true, // Loads ALL brand fields
      validations: true, // Loads ALL validations
      certifications: true, // Loads ALL certifications
      qrCodes: {
        include: {
          scans: true // Loads ALL scans (could be thousands!)
        }
      }
    }
  });
}

// ✅ GOOD: Select only needed fields
async function goodGetProductDetails(productId: string) {
  return await QueryPerformanceMonitor.measureQuery(
    'getProductDetails',
    () => prisma.product.findUnique(productQueries.findWithFullDetails(productId))
  );
}

// ❌ BAD: Not using database indexes
async function badSearchProducts(searchTerm: string) {
  // This query doesn't use indexes efficiently
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ]
    }
  });
  
  // Then filtering in memory (very inefficient!)
  return products.filter(p => p.status === 'VALIDATED');
}

// ✅ GOOD: Use database for filtering
async function goodSearchProducts(searchTerm: string) {
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
    take: 20 // Always limit results
  });
}

// ❌ BAD: Not using transactions for related operations
async function badCreateValidationWithNotification(data: any) {
  try {
    const validation = await prisma.validation.create({ data });
    
    // If this fails, validation is created but no notification!
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: 'VALIDATION_CREATED',
        title: 'New Validation',
        message: `Validation ${validation.id} created`
      }
    });
    
    return { validation, notification };
  } catch (error) {
    // Inconsistent state!
    throw error;
  }
}

// ✅ GOOD: Use transactions for consistency
async function goodCreateValidationWithNotification(data: any) {
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
    
    // Update product status atomically
    await tx.product.update({
      where: { id: data.productId },
      data: { status: 'IN_VALIDATION' }
    });
    
    return { validation, notification };
  });
}

// ❌ BAD: Loading data then counting in memory
async function badGetPaginatedProducts(page: number, limit: number) {
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

// ✅ GOOD: Use database pagination
async function goodGetPaginatedProducts(page: number, limit: number) {
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

// ❌ BAD: Not caching repeated queries
async function badGetUserPermissions(userId: string) {
  // This might be called multiple times per request
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

// ✅ GOOD: Cache frequently accessed data
const permissionCache = new Map<string, { permissions: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function goodGetUserPermissions(userId: string) {
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

// ❌ BAD: Not handling large datasets properly
async function badExportAllProducts(brandId: string) {
  // This could load millions of records into memory!
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

// ✅ GOOD: Use cursor-based pagination for large datasets
async function* goodExportAllProducts(brandId: string) {
  const batchSize = 100;
  let cursor: string | undefined;
  
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
    
    if (products.length === 0) break;
    
    yield products;
    
    cursor = products[products.length - 1].id;
    
    if (products.length < batchSize) break;
  }
}

// ❌ BAD: Not using database aggregations
async function badCalculateMonthlyStats(brandId: string, year: number, month: number) {
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
  
  // Calculate in JavaScript (inefficient!)
  const stats = {
    totalProducts: products.length,
    validatedProducts: products.filter(p => p.status === 'VALIDATED').length,
    totalValidations: products.reduce((sum, p) => sum + p.validations.length, 0),
    totalScans: products.reduce((sum, p) => 
      sum + p.qrCodes.reduce((qrSum, qr) => qrSum + qr.scans.length, 0), 0
    )
  };
  
  return stats;
}

// ✅ GOOD: Use database aggregations
async function goodCalculateMonthlyStats(brandId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const [productStats, validationStats, scanStats] = await Promise.all([
    // Product statistics
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
    
    // Validation statistics  
    prisma.validation.aggregate({
      where: {
        product: { brandId },
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    }),
    
    // Scan statistics using raw query for complex aggregation
    prisma.$queryRaw<[{ totalScans: bigint }]>`
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

// Export examples for documentation
export const QueryExamples = {
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