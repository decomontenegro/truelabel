"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBrandRepository = void 0;
const Brand_1 = require("../../../domain/entities/Brand");
class PrismaBrandRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const data = await this.prisma.brand.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true,
                        users: true
                    }
                }
            }
        });
        if (!data) {
            return null;
        }
        return this.toDomain(data);
    }
    async findByDocument(document) {
        const data = await this.prisma.brand.findFirst({
            where: {
                OR: [
                    { cnpj: document },
                    { cpf: document }
                ]
            }
        });
        if (!data) {
            return null;
        }
        return this.toDomain(data);
    }
    async save(brand) {
        const data = this.toPersistence(brand);
        await this.prisma.brand.upsert({
            where: { id: data.id },
            create: data,
            update: data
        });
    }
    async delete(id) {
        await this.prisma.brand.delete({
            where: { id }
        });
    }
    async findMany(criteria) {
        const where = {};
        if (criteria.search) {
            where.OR = [
                { name: { contains: criteria.search, mode: 'insensitive' } },
                { tradeName: { contains: criteria.search, mode: 'insensitive' } }
            ];
        }
        if (criteria.active !== undefined) {
            where.active = criteria.active;
        }
        const brands = await this.prisma.brand.findMany({
            where,
            take: criteria.limit || 10,
            skip: criteria.offset || 0,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        products: true,
                        users: true
                    }
                }
            }
        });
        return brands.map(b => this.toDomain(b));
    }
    async existsByDocument(document, excludeId) {
        const where = {
            OR: [
                { cnpj: document },
                { cpf: document }
            ]
        };
        if (excludeId) {
            where.NOT = { id: excludeId };
        }
        const count = await this.prisma.brand.count({ where });
        return count > 0;
    }
    toDomain(raw) {
        return Brand_1.Brand.reconstitute({
            name: raw.name,
            tradeName: raw.tradeName,
            document: raw.cnpj || raw.cpf,
            email: raw.email,
            phone: raw.phone,
            website: raw.website,
            logo: raw.logo,
            description: raw.description,
            address: raw.address,
            socialMedia: raw.socialMedia,
            active: raw.active,
            verified: raw.verified,
            productCount: raw._count?.products || 0,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt
        }, raw.id);
    }
    toPersistence(brand) {
        const isCNPJ = brand.document.length === 14;
        return {
            id: brand.id,
            name: brand.name,
            tradeName: brand.tradeName,
            cnpj: isCNPJ ? brand.document : null,
            cpf: !isCNPJ ? brand.document : null,
            email: brand.email,
            phone: brand.phone,
            website: brand.website,
            logo: brand.logo,
            description: brand.description,
            address: brand.address,
            socialMedia: brand.socialMedia,
            active: brand.active,
            verified: brand.verified,
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt
        };
    }
}
exports.PrismaBrandRepository = PrismaBrandRepository;
//# sourceMappingURL=PrismaBrandRepository.js.map