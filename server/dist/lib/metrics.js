"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.performanceMetrics = exports.reportMetrics = exports.productMetrics = exports.apiResponseTime = exports.redisConnections = exports.cacheSize = exports.pendingValidations = exports.activeConnections = exports.fileUploadSize = exports.dbQueryDuration = exports.httpRequestDuration = exports.cacheMisses = exports.cacheHits = exports.authAttempts = exports.qrScanTotal = exports.validationTotal = exports.httpRequestTotal = void 0;
exports.recordError = recordError;
exports.measureOperation = measureOperation;
exports.metricsEndpoint = metricsEndpoint;
exports.resetMetrics = resetMetrics;
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
(0, prom_client_1.collectDefaultMetrics)({
    prefix: 'true_label_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});
exports.httpRequestTotal = new prom_client_1.Counter({
    name: 'true_label_http_requests_total',
    help: 'Total de requisições HTTP',
    labelNames: ['method', 'route', 'status_code']
});
exports.validationTotal = new prom_client_1.Counter({
    name: 'true_label_validations_total',
    help: 'Total de validações criadas',
    labelNames: ['type', 'status']
});
exports.qrScanTotal = new prom_client_1.Counter({
    name: 'true_label_qr_scans_total',
    help: 'Total de QR codes escaneados',
    labelNames: ['product_category']
});
exports.authAttempts = new prom_client_1.Counter({
    name: 'true_label_auth_attempts_total',
    help: 'Total de tentativas de autenticação',
    labelNames: ['type', 'success']
});
exports.cacheHits = new prom_client_1.Counter({
    name: 'true_label_cache_hits_total',
    help: 'Total de cache hits',
    labelNames: ['key_type']
});
exports.cacheMisses = new prom_client_1.Counter({
    name: 'true_label_cache_misses_total',
    help: 'Total de cache misses',
    labelNames: ['key_type']
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'true_label_http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});
exports.dbQueryDuration = new prom_client_1.Histogram({
    name: 'true_label_db_query_duration_seconds',
    help: 'Duração das queries do banco de dados',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});
exports.fileUploadSize = new prom_client_1.Histogram({
    name: 'true_label_file_upload_size_bytes',
    help: 'Tamanho dos arquivos enviados em bytes',
    labelNames: ['type'],
    buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800]
});
exports.activeConnections = new prom_client_1.Gauge({
    name: 'true_label_active_connections',
    help: 'Número de conexões ativas',
    labelNames: ['type']
});
exports.pendingValidations = new prom_client_1.Gauge({
    name: 'true_label_pending_validations',
    help: 'Número de validações pendentes'
});
exports.cacheSize = new prom_client_1.Gauge({
    name: 'true_label_cache_size',
    help: 'Tamanho do cache em memória'
});
exports.redisConnections = new prom_client_1.Gauge({
    name: 'true_label_redis_connections',
    help: 'Número de conexões Redis ativas'
});
exports.apiResponseTime = new prom_client_1.Summary({
    name: 'true_label_api_response_time_seconds',
    help: 'Tempo de resposta da API',
    labelNames: ['endpoint'],
    percentiles: [0.5, 0.9, 0.95, 0.99]
});
exports.productMetrics = {
    created: new prom_client_1.Counter({
        name: 'true_label_products_created_total',
        help: 'Total de produtos criados',
        labelNames: ['category', 'brand']
    }),
    validated: new prom_client_1.Counter({
        name: 'true_label_products_validated_total',
        help: 'Total de produtos validados',
        labelNames: ['category', 'validation_type']
    })
};
exports.reportMetrics = {
    uploaded: new prom_client_1.Counter({
        name: 'true_label_reports_uploaded_total',
        help: 'Total de relatórios enviados',
        labelNames: ['laboratory', 'analysis_type']
    }),
    parsed: new prom_client_1.Counter({
        name: 'true_label_reports_parsed_total',
        help: 'Total de relatórios processados',
        labelNames: ['success']
    })
};
exports.performanceMetrics = {
    cacheEfficiency: new prom_client_1.Gauge({
        name: 'true_label_cache_efficiency',
        help: 'Eficiência do cache (hit rate)',
        async collect() {
            const hits = await exports.cacheHits.get();
            const misses = await exports.cacheMisses.get();
            const total = hits.values.reduce((sum, v) => sum + v.value, 0) +
                misses.values.reduce((sum, v) => sum + v.value, 0);
            if (total > 0) {
                const hitRate = hits.values.reduce((sum, v) => sum + v.value, 0) / total;
                this.set(hitRate);
            }
        }
    })
};
function recordError(error, context) {
    const errorCounter = new prom_client_1.Counter({
        name: 'true_label_errors_total',
        help: 'Total de erros',
        labelNames: ['type', 'route'],
        registers: [prom_client_1.register]
    });
    errorCounter.inc({
        type: error.name || 'UnknownError',
        route: context.route || 'unknown'
    });
}
function measureOperation(operation, labels, fn) {
    const timer = exports.dbQueryDuration.startTimer(labels);
    return fn()
        .then(result => {
        timer();
        return result;
    })
        .catch(error => {
        timer();
        throw error;
    });
}
function metricsEndpoint() {
    return async (_req, res) => {
        try {
            res.set('Content-Type', prom_client_1.register.contentType);
            const metrics = await prom_client_1.register.metrics();
            res.end(metrics);
        }
        catch (err) {
            res.status(500).end(err);
        }
    };
}
function resetMetrics() {
    prom_client_1.register.clear();
}
//# sourceMappingURL=metrics.js.map