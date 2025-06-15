import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import performanceService from '../services/performanceService';
import { metricsEndpoint } from '../lib/metrics';
import { log } from '../lib/logger';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * Dashboard de monitoramento (apenas admin)
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const report = await performanceService.generatePerformanceReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Métricas do sistema
 */
router.get('/system', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const metrics = await performanceService.getSystemMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Métricas do banco de dados
 */
router.get('/database', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const metrics = await performanceService.getDatabaseMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Alertas de performance
 */
router.get('/alerts', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const alerts = await performanceService.checkPerformanceAlerts();
    
    res.json({
      success: true,
      hasAlerts: alerts.length > 0,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logs recentes (últimas 100 entradas)
 */
router.get('/logs', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // Em produção, isso viria de um serviço de logs centralizado
    // Por enquanto, retornar logs mock
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Sistema operacional',
        meta: {}
      }
    ];
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Queries lentas do banco
 */
router.get('/slow-queries', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Isso seria ideal ter uma tabela de auditoria ou usar pg_stat_statements
    // Por enquanto, retornar dados mock
    const slowQueries = [
      {
        query: 'SELECT * FROM products WHERE status = ?',
        duration: 523,
        timestamp: new Date().toISOString(),
        model: 'Product'
      }
    ];
    
    res.json({
      success: true,
      data: slowQueries
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cache stats
 */
router.get('/cache', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { redis, cache } = await import('../lib/redis');
    
    // Verificar se Redis está disponível
    const isAvailable = redis.isAvailable();
    
    if (!isAvailable) {
      return res.json({
        success: true,
        data: {
          available: false,
          message: 'Redis não está disponível'
        }
      });
    }
    
    // Obter informações do Redis (seria necessário implementar no redis.ts)
    const info = {
      available: true,
      // Adicionar mais estatísticas quando implementar no redis.ts
    };
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Métricas do Prometheus (formato texto)
 */
router.get('/metrics', metricsEndpoint());

/**
 * Health check detalhado
 */
router.get('/health/detailed', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const checks = {
      api: true,
      database: false,
      redis: false,
      filesystem: true
    };
    
    // Verificar banco de dados
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      log.error('Health check: Database failed', error as Error);
    }
    
    // Verificar Redis
    try {
      const { redis } = await import('../lib/redis');
      checks.redis = redis.isAvailable();
    } catch (error) {
      log.error('Health check: Redis failed', error as Error);
    }
    
    const allHealthy = Object.values(checks).every(check => check === true);
    
    res.status(allHealthy ? 200 : 503).json({
      success: true,
      healthy: allHealthy,
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;