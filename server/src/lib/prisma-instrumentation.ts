import { PrismaClient } from '@prisma/client';
import { dbQueryDuration } from './metrics';
import { log } from './logger';
import { addBreadcrumb } from './sentry';

// Estender o Prisma Client com instrumentação
export function instrumentPrismaClient(prisma: PrismaClient) {
  // Middleware para logging e métricas
  prisma.$use(async (params, next) => {
    const startTime = Date.now();
    const model = params.model || 'unknown';
    const action = params.action;

    try {
      // Executar query
      const result = await next(params);
      
      // Calcular duração
      const duration = Date.now() - startTime;
      
      // Registrar métrica
      dbQueryDuration.observe(
        { operation: action, model },
        duration / 1000
      );
      
      // Log para queries lentas
      if (duration > 100) {
        log.warn('Query lenta detectada', {
          model,
          action,
          duration,
          args: params.args
        });
        
        // Adicionar breadcrumb no Sentry
        addBreadcrumb({
          message: `Slow database query: ${model}.${action}`,
          category: 'database',
          level: 'warning',
          data: {
            duration,
            model,
            action
          }
        });
      }
      
      // Log debug para todas as queries em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        log.debug(`Prisma ${model}.${action}`, {
          duration,
          args: params.args
        });
      }
      
      return result;
    } catch (error) {
      // Log de erro
      log.error(`Erro em Prisma ${model}.${action}`, error as Error, {
        model,
        action,
        args: params.args
      });
      
      // Re-lançar erro
      throw error;
    }
  });

  // Middleware para contagem de registros
  prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // Contar registros para métricas
    if (params.action === 'create' || params.action === 'createMany') {
      const model = params.model?.toLowerCase() || 'unknown';
      
      switch (model) {
        case 'product':
          const { productMetrics } = await import('./metrics');
          productMetrics.created.inc({ 
            category: params.args?.data?.category || 'unknown',
            brand: params.args?.data?.brand || 'unknown'
          });
          break;
          
        case 'validation':
          const { validationTotal } = await import('./metrics');
          validationTotal.inc({
            type: params.args?.data?.type || 'unknown',
            status: params.args?.data?.status || 'unknown'
          });
          break;
          
        case 'report':
          const { reportMetrics } = await import('./metrics');
          reportMetrics.uploaded.inc({
            laboratory: 'unknown', // Seria necessário buscar o nome
            analysis_type: params.args?.data?.analysisType || 'unknown'
          });
          break;
      }
    }
    
    return result;
  });

  return prisma;
}

// Função para criar instância instrumentada do Prisma
export function createInstrumentedPrismaClient() {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Eventos de log
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      log.warn('Query SQL lenta', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target
      });
    }
  });

  prisma.$on('error', (e) => {
    log.error('Erro do Prisma', new Error(e.message), {
      target: e.target,
      timestamp: e.timestamp
    });
  });

  prisma.$on('warn', (e) => {
    log.warn('Aviso do Prisma', {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp
    });
  });

  // Aplicar instrumentação
  return instrumentPrismaClient(prisma);
}

// Pool de conexões e métricas
export async function getPrismaMetrics(prisma: PrismaClient) {
  try {
    // Executar query simples para verificar conexão
    await prisma.$queryRaw`SELECT 1`;
    
    // Obter métricas do pool (se disponível)
    const metrics = await prisma.$metrics.json();
    
    return {
      healthy: true,
      metrics
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}