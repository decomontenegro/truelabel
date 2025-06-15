import { PrismaClient } from '@prisma/client';
export declare function instrumentPrismaClient(prisma: PrismaClient): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function createInstrumentedPrismaClient(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function getPrismaMetrics(prisma: PrismaClient): Promise<{
    healthy: boolean;
    metrics: any;
    error?: undefined;
} | {
    healthy: boolean;
    error: string;
    metrics?: undefined;
}>;
//# sourceMappingURL=prisma-instrumentation.d.ts.map