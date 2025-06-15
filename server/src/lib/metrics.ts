import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { config } from '../config/env';

// Coletar métricas padrão (CPU, memória, etc.)
collectDefaultMetrics({
  prefix: 'true_label_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Métricas customizadas

// Contadores
export const httpRequestTotal = new Counter({
  name: 'true_label_http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code']
});

export const validationTotal = new Counter({
  name: 'true_label_validations_total',
  help: 'Total de validações criadas',
  labelNames: ['type', 'status']
});

export const qrScanTotal = new Counter({
  name: 'true_label_qr_scans_total',
  help: 'Total de QR codes escaneados',
  labelNames: ['product_category']
});

export const authAttempts = new Counter({
  name: 'true_label_auth_attempts_total',
  help: 'Total de tentativas de autenticação',
  labelNames: ['type', 'success']
});

export const cacheHits = new Counter({
  name: 'true_label_cache_hits_total',
  help: 'Total de cache hits',
  labelNames: ['key_type']
});

export const cacheMisses = new Counter({
  name: 'true_label_cache_misses_total',
  help: 'Total de cache misses',
  labelNames: ['key_type']
});

// Histogramas
export const httpRequestDuration = new Histogram({
  name: 'true_label_http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

export const dbQueryDuration = new Histogram({
  name: 'true_label_db_query_duration_seconds',
  help: 'Duração das queries do banco de dados',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

export const fileUploadSize = new Histogram({
  name: 'true_label_file_upload_size_bytes',
  help: 'Tamanho dos arquivos enviados em bytes',
  labelNames: ['type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800] // 1KB, 10KB, 100KB, 1MB, 10MB, 50MB
});

// Gauges
export const activeConnections = new Gauge({
  name: 'true_label_active_connections',
  help: 'Número de conexões ativas',
  labelNames: ['type'] // websocket, http
});

export const pendingValidations = new Gauge({
  name: 'true_label_pending_validations',
  help: 'Número de validações pendentes'
});

export const cacheSize = new Gauge({
  name: 'true_label_cache_size',
  help: 'Tamanho do cache em memória'
});

export const redisConnections = new Gauge({
  name: 'true_label_redis_connections',
  help: 'Número de conexões Redis ativas'
});

// Summary
export const apiResponseTime = new Summary({
  name: 'true_label_api_response_time_seconds',
  help: 'Tempo de resposta da API',
  labelNames: ['endpoint'],
  percentiles: [0.5, 0.9, 0.95, 0.99]
});

// Métricas de negócio
export const productMetrics = {
  created: new Counter({
    name: 'true_label_products_created_total',
    help: 'Total de produtos criados',
    labelNames: ['category', 'brand']
  }),
  
  validated: new Counter({
    name: 'true_label_products_validated_total',
    help: 'Total de produtos validados',
    labelNames: ['category', 'validation_type']
  })
};

export const reportMetrics = {
  uploaded: new Counter({
    name: 'true_label_reports_uploaded_total',
    help: 'Total de relatórios enviados',
    labelNames: ['laboratory', 'analysis_type']
  }),
  
  parsed: new Counter({
    name: 'true_label_reports_parsed_total',
    help: 'Total de relatórios processados',
    labelNames: ['success']
  })
};

// Métricas de performance
export const performanceMetrics = {
  cacheEfficiency: new Gauge({
    name: 'true_label_cache_efficiency',
    help: 'Eficiência do cache (hit rate)',
    async collect() {
      // Calcular hit rate
      const hits = await cacheHits.get();
      const misses = await cacheMisses.get();
      const total = hits.values.reduce((sum, v) => sum + v.value, 0) + 
                   misses.values.reduce((sum, v) => sum + v.value, 0);
      
      if (total > 0) {
        const hitRate = hits.values.reduce((sum, v) => sum + v.value, 0) / total;
        this.set(hitRate);
      }
    }
  })
};

// Função para registrar métricas de erro
export function recordError(error: Error, context: { route?: string; userId?: string }) {
  const errorCounter = new Counter({
    name: 'true_label_errors_total',
    help: 'Total de erros',
    labelNames: ['type', 'route'],
    registers: [register]
  });

  errorCounter.inc({
    type: error.name || 'UnknownError',
    route: context.route || 'unknown'
  });
}

// Função para medir performance de operações
export function measureOperation<T>(
  operation: string,
  labels: Record<string, string>,
  fn: () => Promise<T>
): Promise<T> {
  const timer = dbQueryDuration.startTimer(labels);
  
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

// Endpoint para expor métricas
export function metricsEndpoint() {
  return async (_req: any, res: any) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (err) {
      res.status(500).end(err);
    }
  };
}

// Resetar métricas (útil para testes)
export function resetMetrics() {
  register.clear();
}

export { register };