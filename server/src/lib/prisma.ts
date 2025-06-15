import { PrismaClient } from '@prisma/client';
import { config, isDevelopment, isProduction } from '../config/env';
import { dbQueryDuration } from './metrics';
import { log } from './logger';
import { addBreadcrumb } from './sentry';
import { prismaOptimizationMiddleware } from '../utils/database/prisma-optimizations';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Configuração otimizada do Prisma Client com connection pooling
 * 
 * Em produção:
 * - Connection limit baseado no plano do banco de dados
 * - Timeout adequado para evitar conexões penduradas
 * - Query timeout para evitar queries longas
 * 
 * Em desenvolvimento:
 * - Reutiliza a mesma instância para hot reload
 * - Logs habilitados para debugging
 */

const createPrismaClient = () => {
  return new PrismaClient({
    log: isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    // Connection pool configuration
    // Ajuste estes valores baseado no seu plano de banco de dados
    ...(isProduction && {
      datasources: {
        db: {
          url: config.database.url + '?connection_limit=10&pool_timeout=20&connect_timeout=10',
        },
      },
    }),
  });
};

// Previne múltiplas instâncias do Prisma em desenvolvimento (hot reload)
export const prisma = global.prisma || createPrismaClient();

if (!isProduction) {
  global.prisma = prisma;
}

// Adicionar middleware de otimização
prisma.$use(prismaOptimizationMiddleware);

// Middleware para logging de queries lentas e métricas
prisma.$use(async (params, next) => {
  const before = Date.now();
  const model = params.model || 'unknown';
  const action = params.action;
  
  try {
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;
    
    // Registrar métrica
    dbQueryDuration.observe(
      { operation: action, model },
      duration / 1000
    );
    
    // Log queries que demoram mais de 100ms
    if (duration > 100) {
      if (isDevelopment) {
        console.warn(`⚠️ Slow query (${duration}ms): ${model}.${action}`);
      }
      
      log.warn('Query lenta detectada', {
        model,
        action,
        duration,
        args: isDevelopment ? params.args : undefined
      });
      
      // Adicionar breadcrumb no Sentry
      addBreadcrumb({
        message: `Slow database query: ${model}.${action}`,
        category: 'database',
        level: 'warning',
        data: { duration, model, action }
      });
    }
    
    return result;
  } catch (error) {
    log.error(`Erro em Prisma ${model}.${action}`, error as Error, {
      model,
      action
    });
    throw error;
  }
});

// Middleware para soft delete (se necessário no futuro)
prisma.$use(async (params, next) => {
  // Soft delete logic can be added here
  return next(params);
});

// Função para verificar a saúde da conexão
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Função para desconectar gracefully
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
}

// Handle process termination
if (isProduction) {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
}

// Export types úteis
export type { User, Product, Validation, Report, Laboratory } from '@prisma/client';

// Configurações recomendadas para diferentes ambientes:
// 
// Desenvolvimento (SQLite):
// - Sem necessidade de connection pooling
// - Logs completos habilitados
//
// Produção (PostgreSQL no Supabase/Neon):
// - connection_limit: 10-20 (depende do plano)
// - pool_timeout: 20 segundos
// - connect_timeout: 10 segundos
//
// Produção (PostgreSQL no Railway/Render):
// - connection_limit: 5-10 (planos gratuitos têm limites menores)
// - pool_timeout: 10 segundos
// - connect_timeout: 5 segundos
//
// Para ajustar, modifique a URL de conexão no .env:
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"