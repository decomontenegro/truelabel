import { PrismaClient } from '@prisma/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function checkDatabaseConnection(): Promise<boolean>;
export declare function disconnectDatabase(): Promise<void>;
export type { User, Product, Validation, Report, Laboratory } from '@prisma/client';
//# sourceMappingURL=prisma.d.ts.map