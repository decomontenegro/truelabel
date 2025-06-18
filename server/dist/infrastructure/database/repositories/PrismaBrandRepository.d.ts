import { PrismaClient } from '@prisma/client';
import { Brand } from '../../../domain/entities/Brand';
import { IBrandRepository } from '../../../domain/repositories/IBrandRepository';
export declare class PrismaBrandRepository implements IBrandRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<Brand | null>;
    findByDocument(document: string): Promise<Brand | null>;
    save(brand: Brand): Promise<void>;
    delete(id: string): Promise<void>;
    findMany(criteria: {
        search?: string;
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Brand[]>;
    existsByDocument(document: string, excludeId?: string): Promise<boolean>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=PrismaBrandRepository.d.ts.map