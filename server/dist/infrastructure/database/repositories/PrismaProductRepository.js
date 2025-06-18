"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProductRepository = void 0;
const Product_1 = require("../../../domain/entities/Product");
const EAN_1 = require("../../../domain/value-objects/EAN");
const ProductName_1 = require("../../../domain/value-objects/ProductName");
const Claim_1 = require("../../../domain/value-objects/Claim");
const prisma_optimizations_1 = require("../../../utils/database/prisma-optimizations");
class PrismaProductRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const data = await this.prisma.product.findUnique(prisma_optimizations_1.productQueries.findWithFullDetails(id));
        if (!data) {
            return null;
        }
        return this.toDomain(data);
    }
    async findByEAN(ean) {
        const data = await this.prisma.product.findFirst({
            where: { ean }
        });
        if (!data) {
            return null;
        }
        return this.toDomain(data);
    }
    async save(product) {
        const data = this.toPersistence(product);
        await this.prisma.product.upsert({
            where: { id: data.id },
            create: data,
            update: data
        });
    }
    async delete(id) {
        await this.prisma.product.delete({
            where: { id }
        });
    }
    async findMany(criteria) {
        const where = {};
        if (criteria.brandId) {
            where.brandId = criteria.brandId;
        }
        if (criteria.status) {
            where.status = criteria.status;
        }
        if (criteria.category) {
            where.category = criteria.category;
        }
        if (criteria.search) {
            where.OR = [
                { name: { contains: criteria.search, mode: 'insensitive' } },
                { description: { contains: criteria.search, mode: 'insensitive' } },
                { ean: { contains: criteria.search } }
            ];
        }
        const products = await this.prisma.product.findMany({
            where,
            take: criteria.limit || 10,
            skip: criteria.offset || 0,
            orderBy: { createdAt: 'desc' }
        });
        return Promise.all(products.map(p => this.toDomain(p)));
    }
    async countByBrand(brandId) {
        return this.prisma.product.count({
            where: { brandId }
        });
    }
    toDomain(raw) {
        const name = ProductName_1.ProductName.create(raw.name);
        const ean = EAN_1.EAN.create(raw.ean);
        const claims = (raw.claims || []).map((c) => Claim_1.Claim.create(c));
        return Product_1.Product.reconstitute({
            name,
            description: raw.description,
            ean,
            category: raw.category,
            status: raw.status,
            brandId: raw.brandId,
            claims,
            ingredients: raw.ingredients || [],
            nutritionalInfo: raw.nutritionalInfo,
            images: raw.images || [],
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt
        }, raw.id);
    }
    toPersistence(product) {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            ean: product.ean,
            category: product.category,
            status: product.status,
            brandId: product.brandId,
            claims: product.claims,
            ingredients: product.ingredients,
            nutritionalInfo: product.nutritionalInfo,
            images: product.images,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }
}
exports.PrismaProductRepository = PrismaProductRepository;
//# sourceMappingURL=PrismaProductRepository.js.map