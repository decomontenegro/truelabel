import { PrismaClient } from '@prisma/client';
import { Brand } from '../../../domain/entities/Brand';
import { IBrandRepository } from '../../../domain/repositories/IBrandRepository';
import { brandQueries } from '../../../utils/database/prisma-optimizations';

export class PrismaBrandRepository implements IBrandRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Brand | null> {
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

  async findByDocument(document: string): Promise<Brand | null> {
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

  async save(brand: Brand): Promise<void> {
    const data = this.toPersistence(brand);

    await this.prisma.brand.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brand.delete({
      where: { id }
    });
  }

  async findMany(criteria: {
    search?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Brand[]> {
    const where: any = {};

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

  async existsByDocument(document: string, excludeId?: string): Promise<boolean> {
    const where: any = {
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

  private toDomain(raw: any): Brand {
    return Brand.reconstitute(
      {
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
      },
      raw.id
    );
  }

  private toPersistence(brand: Brand): any {
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