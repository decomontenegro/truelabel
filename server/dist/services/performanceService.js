"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_1 = require("../lib/metrics");
const logger_1 = require("../lib/logger");
const client_1 = require("@prisma/client");
const os_1 = __importDefault(require("os"));
const prisma = new client_1.PrismaClient();
class PerformanceService {
    async getSystemMetrics() {
        const cpuUsage = process.cpuUsage();
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const totalMemory = os_1.default.totalmem();
        const freeMemory = os_1.default.freemem();
        const loadAverage = os_1.default.loadavg();
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
                cpuCount: os_1.default.cpus().length
            }
        };
    }
    async getDatabaseMetrics() {
        try {
            const [productCount, validationCount, reportCount, userCount] = await Promise.all([
                prisma.product.count(),
                prisma.validation.count(),
                prisma.report.count(),
                prisma.user.count()
            ]);
            const [pendingValidations, approvedValidations, rejectedValidations] = await Promise.all([
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
        }
        catch (error) {
            logger_1.log.error('Erro ao obter métricas do banco', error);
            return null;
        }
    }
    async getPrometheusMetrics() {
        try {
            const metrics = await metrics_1.register.metrics();
            return this.parsePrometheusMetrics(metrics);
        }
        catch (error) {
            logger_1.log.error('Erro ao obter métricas do Prometheus', error);
            return null;
        }
    }
    parsePrometheusMetrics(metricsText) {
        const lines = metricsText.split('\n');
        const metrics = {};
        for (const line of lines) {
            if (line.startsWith('#') || !line.trim())
                continue;
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
    parseLabels(labelsString) {
        const labels = {};
        const matches = labelsString.matchAll(/(\w+)="([^"]+)"/g);
        for (const match of matches) {
            labels[match[1]] = match[2];
        }
        return labels;
    }
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
        logger_1.log.info('Relatório de performance gerado', report);
        return report;
    }
    summarizeMetrics(metrics) {
        if (!metrics)
            return null;
        const summary = {};
        if (metrics['true_label_http_requests_total']) {
            const httpRequests = metrics['true_label_http_requests_total'];
            summary.httpRequests = {
                total: httpRequests.reduce((sum, m) => sum + m.value, 0),
                byStatus: this.groupByLabel(httpRequests, 'status_code'),
                byMethod: this.groupByLabel(httpRequests, 'method')
            };
        }
        if (metrics['true_label_api_response_time_seconds']) {
            const responseTimes = metrics['true_label_api_response_time_seconds'];
            summary.responseTime = {
                count: responseTimes.find((m) => m.labels.quantile === 'count')?.value || 0,
                p50: responseTimes.find((m) => m.labels.quantile === '0.5')?.value || 0,
                p90: responseTimes.find((m) => m.labels.quantile === '0.9')?.value || 0,
                p95: responseTimes.find((m) => m.labels.quantile === '0.95')?.value || 0,
                p99: responseTimes.find((m) => m.labels.quantile === '0.99')?.value || 0
            };
        }
        if (metrics['true_label_cache_hits_total'] && metrics['true_label_cache_misses_total']) {
            const hits = metrics['true_label_cache_hits_total'].reduce((sum, m) => sum + m.value, 0);
            const misses = metrics['true_label_cache_misses_total'].reduce((sum, m) => sum + m.value, 0);
            const total = hits + misses;
            summary.cache = {
                hits,
                misses,
                total,
                hitRate: total > 0 ? (hits / total * 100).toFixed(2) + '%' : '0%'
            };
        }
        if (metrics['true_label_active_connections']) {
            summary.connections = this.groupByLabel(metrics['true_label_active_connections'], 'type');
        }
        return summary;
    }
    groupByLabel(metrics, label) {
        const grouped = {};
        for (const metric of metrics) {
            const key = metric.labels[label] || 'unknown';
            grouped[key] = (grouped[key] || 0) + metric.value;
        }
        return grouped;
    }
    async checkPerformanceAlerts() {
        const metrics = await this.getSystemMetrics();
        const alerts = [];
        const memoryPercent = parseFloat(metrics.system.memoryUsagePercent);
        if (memoryPercent > 80) {
            alerts.push(`Alto uso de memória: ${memoryPercent}%`);
            logger_1.log.error('Alerta de performance: Alto uso de memória', { memoryPercent });
        }
        const heapPercent = (metrics.process.memory.heapUsed / metrics.process.memory.heapTotal) * 100;
        if (heapPercent > 90) {
            alerts.push(`Heap quase cheio: ${heapPercent.toFixed(2)}%`);
            logger_1.log.error('Alerta de performance: Heap quase cheio', { heapPercent });
        }
        const cpuCount = metrics.system.cpuCount;
        if (metrics.system.loadAverage['1m'] > cpuCount * 2) {
            alerts.push(`Alta carga do sistema: ${metrics.system.loadAverage['1m'].toFixed(2)}`);
            logger_1.log.error('Alerta de performance: Alta carga do sistema', {
                loadAverage: metrics.system.loadAverage,
                cpuCount
            });
        }
        return alerts;
    }
    startPeriodicMonitoring(intervalMinutes = 5) {
        setInterval(async () => {
            try {
                const alerts = await this.checkPerformanceAlerts();
                if (alerts.length > 0) {
                    logger_1.log.warn('Alertas de performance detectados', { alerts });
                }
            }
            catch (error) {
                logger_1.log.error('Erro no monitoramento periódico', error);
            }
        }, intervalMinutes * 60 * 1000);
        logger_1.log.info('Monitoramento periódico iniciado', { intervalMinutes });
    }
}
exports.default = new PerformanceService();
//# sourceMappingURL=performanceService.js.map