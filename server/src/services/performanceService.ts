import { register } from '../lib/metrics';
import { log } from '../lib/logger';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const prisma = new PrismaClient();

/**
 * Serviço para monitoramento de performance e geração de relatórios
 */
class PerformanceService {
  /**
   * Obter métricas atuais do sistema
   */
  async getSystemMetrics() {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Informações do sistema
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const loadAverage = os.loadavg();

    return {
      process: {
        uptime: Math.floor(uptime),
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers
        }
      },
      system: {
        totalMemory,
        freeMemory,
        usedMemory: totalMemory - freeMemory,
        memoryUsagePercent: ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2),
        loadAverage: {
          '1m': loadAverage[0],
          '5m': loadAverage[1],
          '15m': loadAverage[2]
        },
        cpuCount: os.cpus().length
      }
    };
  }

  /**
   * Obter métricas do banco de dados
   */
  async getDatabaseMetrics() {
    try {
      // Contar registros principais
      const [
        productCount,
        validationCount,
        reportCount,
        userCount
      ] = await Promise.all([
        prisma.product.count(),
        prisma.validation.count(),
        prisma.report.count(),
        prisma.user.count()
      ]);

      // Estatísticas de validações
      const [
        pendingValidations,
        approvedValidations,
        rejectedValidations
      ] = await Promise.all([
        prisma.validation.count({ where: { status: 'PENDING' } }),
        prisma.validation.count({ where: { status: 'APPROVED' } }),
        prisma.validation.count({ where: { status: 'REJECTED' } })
      ]);

      return {
        counts: {
          products: productCount,
          validations: validationCount,
          reports: reportCount,
          users: userCount
        },
        validations: {
          total: validationCount,
          pending: pendingValidations,
          approved: approvedValidations,
          rejected: rejectedValidations,
          approvalRate: validationCount > 0 
            ? (approvedValidations / validationCount * 100).toFixed(2) + '%'
            : '0%'
        }
      };
    } catch (error) {
      log.error('Erro ao obter métricas do banco', error as Error);
      return null;
    }
  }

  /**
   * Obter métricas do Prometheus formatadas
   */
  async getPrometheusMetrics() {
    try {
      const metrics = await register.metrics();
      return this.parsePrometheusMetrics(metrics);
    } catch (error) {
      log.error('Erro ao obter métricas do Prometheus', error as Error);
      return null;
    }
  }

  /**
   * Parse métricas do Prometheus para formato JSON
   */
  private parsePrometheusMetrics(metricsText: string): Record<string, any> {
    const lines = metricsText.split('\n');
    const metrics: Record<string, any> = {};

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?(.*?)?\}?\s+(.+)$/);
      if (match) {
        const [, name, labels, value] = match;
        
        if (!metrics[name]) {
          metrics[name] = [];
        }

        metrics[name].push({
          labels: labels ? this.parseLabels(labels) : {},
          value: parseFloat(value)
        });
      }
    }

    return metrics;
  }

  /**
   * Parse labels do Prometheus
   */
  private parseLabels(labelsString: string): Record<string, string> {
    const labels: Record<string, string> = {};
    const matches = labelsString.matchAll(/(\w+)="([^"]+)"/g);

    for (const match of matches) {
      labels[match[1]] = match[2];
    }

    return labels;
  }

  /**
   * Gerar relatório de performance
   */
  async generatePerformanceReport() {
    const [systemMetrics, dbMetrics, prometheusMetrics] = await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getPrometheusMetrics()
    ]);

    const report = {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      database: dbMetrics,
      metrics: this.summarizeMetrics(prometheusMetrics)
    };

    // Log do relatório
    log.info('Relatório de performance gerado', report);

    return report;
  }

  /**
   * Resumir métricas principais
   */
  private summarizeMetrics(metrics: Record<string, any> | null) {
    if (!metrics) return null;

    const summary: Record<string, any> = {};

    // HTTP Requests
    if (metrics['true_label_http_requests_total']) {
      const httpRequests = metrics['true_label_http_requests_total'];
      summary.httpRequests = {
        total: httpRequests.reduce((sum: number, m: any) => sum + m.value, 0),
        byStatus: this.groupByLabel(httpRequests, 'status_code'),
        byMethod: this.groupByLabel(httpRequests, 'method')
      };
    }

    // Response times
    if (metrics['true_label_api_response_time_seconds']) {
      const responseTimes = metrics['true_label_api_response_time_seconds'];
      summary.responseTime = {
        count: responseTimes.find((m: any) => m.labels.quantile === 'count')?.value || 0,
        p50: responseTimes.find((m: any) => m.labels.quantile === '0.5')?.value || 0,
        p90: responseTimes.find((m: any) => m.labels.quantile === '0.9')?.value || 0,
        p95: responseTimes.find((m: any) => m.labels.quantile === '0.95')?.value || 0,
        p99: responseTimes.find((m: any) => m.labels.quantile === '0.99')?.value || 0
      };
    }

    // Cache performance
    if (metrics['true_label_cache_hits_total'] && metrics['true_label_cache_misses_total']) {
      const hits = metrics['true_label_cache_hits_total'].reduce((sum: number, m: any) => sum + m.value, 0);
      const misses = metrics['true_label_cache_misses_total'].reduce((sum: number, m: any) => sum + m.value, 0);
      const total = hits + misses;

      summary.cache = {
        hits,
        misses,
        total,
        hitRate: total > 0 ? (hits / total * 100).toFixed(2) + '%' : '0%'
      };
    }

    // Active connections
    if (metrics['true_label_active_connections']) {
      summary.connections = this.groupByLabel(metrics['true_label_active_connections'], 'type');
    }

    return summary;
  }

  /**
   * Agrupar métricas por label
   */
  private groupByLabel(metrics: any[], label: string): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const metric of metrics) {
      const key = metric.labels[label] || 'unknown';
      grouped[key] = (grouped[key] || 0) + metric.value;
    }

    return grouped;
  }

  /**
   * Alertas de performance
   */
  async checkPerformanceAlerts() {
    const metrics = await this.getSystemMetrics();
    const alerts: string[] = [];

    // Verificar uso de memória
    const memoryPercent = parseFloat(metrics.system.memoryUsagePercent);
    if (memoryPercent > 80) {
      alerts.push(`Alto uso de memória: ${memoryPercent}%`);
      log.error('Alerta de performance: Alto uso de memória', { memoryPercent });
    }

    // Verificar heap
    const heapPercent = (metrics.process.memory.heapUsed / metrics.process.memory.heapTotal) * 100;
    if (heapPercent > 90) {
      alerts.push(`Heap quase cheio: ${heapPercent.toFixed(2)}%`);
      log.error('Alerta de performance: Heap quase cheio', { heapPercent });
    }

    // Verificar load average
    const cpuCount = metrics.system.cpuCount;
    if (metrics.system.loadAverage['1m'] > cpuCount * 2) {
      alerts.push(`Alta carga do sistema: ${metrics.system.loadAverage['1m'].toFixed(2)}`);
      log.error('Alerta de performance: Alta carga do sistema', { 
        loadAverage: metrics.system.loadAverage,
        cpuCount 
      });
    }

    return alerts;
  }

  /**
   * Iniciar monitoramento periódico
   */
  startPeriodicMonitoring(intervalMinutes = 5) {
    setInterval(async () => {
      try {
        const alerts = await this.checkPerformanceAlerts();
        if (alerts.length > 0) {
          log.warn('Alertas de performance detectados', { alerts });
        }
      } catch (error) {
        log.error('Erro no monitoramento periódico', error as Error);
      }
    }, intervalMinutes * 60 * 1000);

    log.info('Monitoramento periódico iniciado', { intervalMinutes });
  }
}

export default new PerformanceService();