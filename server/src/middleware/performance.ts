import { Request, Response, NextFunction } from 'express';
import responseTime from 'response-time';
import { 
  httpRequestTotal, 
  httpRequestDuration, 
  activeConnections,
  apiResponseTime,
  cacheHits,
  cacheMisses
} from '../lib/metrics';
import { log } from '../lib/logger';
import { captureException, setUser } from '@sentry/node';
import { startTransaction } from '../lib/sentry';
import { AuthRequest } from './auth';

// Middleware para medir tempo de resposta
export const performanceMonitoring = responseTime((req: Request, res: Response, time: number) => {
  const route = req.route?.path || req.path || 'unknown';
  const method = req.method;
  const statusCode = res.statusCode.toString();

  // Registrar métricas do Prometheus
  httpRequestTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, time / 1000);
  apiResponseTime.observe({ endpoint: route }, time / 1000);

  // Log de performance para requisições lentas
  if (time > 1000) { // Mais de 1 segundo
    log.warn('Requisição lenta detectada', {
      method,
      route,
      duration: time,
      statusCode,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }

  // Log HTTP estruturado
  log.http('HTTP Request', {
    method,
    route,
    statusCode,
    duration: time,
    contentLength: res.get('content-length'),
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: (req as AuthRequest).user?.id
  });
});

// Middleware para rastrear conexões ativas
export const connectionTracking = (req: Request, res: Response, next: NextFunction) => {
  activeConnections.inc({ type: 'http' });

  res.on('finish', () => {
    activeConnections.dec({ type: 'http' });
  });

  res.on('close', () => {
    activeConnections.dec({ type: 'http' });
  });

  next();
};

// Middleware para Sentry Performance
export const sentryPerformance = (req: Request, res: Response, next: NextFunction) => {
  const transaction = startTransaction({
    op: 'http.server',
    name: `${req.method} ${req.route?.path || req.path}`,
    data: {
      url: req.url,
      method: req.method,
      query: req.query,
      ip: req.ip
    }
  });

  // Adicionar informações do usuário se disponível
  if ((req as AuthRequest).user) {
    setUser({
      id: (req as AuthRequest).user!.id,
      email: (req as AuthRequest).user!.email
    });
  }

  // Finalizar transação quando a resposta for enviada
  res.on('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
  });

  next();
};

// Middleware para detectar memory leaks
let lastMemoryUsage = process.memoryUsage();
let memoryLeakCounter = 0;

export const memoryMonitoring = (_req: Request, _res: Response, next: NextFunction) => {
  const currentMemory = process.memoryUsage();
  const heapDiff = currentMemory.heapUsed - lastMemoryUsage.heapUsed;

  // Se a memória aumentou mais de 50MB desde a última verificação
  if (heapDiff > 50 * 1024 * 1024) {
    memoryLeakCounter++;
    
    if (memoryLeakCounter > 5) {
      log.error('Possível memory leak detectado', {
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024) + 'MB',
        heapDiff: Math.round(heapDiff / 1024 / 1024) + 'MB',
        rss: Math.round(currentMemory.rss / 1024 / 1024) + 'MB'
      });
      
      // Capturar no Sentry
      captureException(new Error('Possible memory leak detected'), {
        extra: {
          heapUsed: currentMemory.heapUsed,
          heapDiff,
          rss: currentMemory.rss
        }
      });
      
      memoryLeakCounter = 0;
    }
  } else if (heapDiff < 0) {
    // Reset counter se a memória diminuiu (GC ocorreu)
    memoryLeakCounter = 0;
  }

  lastMemoryUsage = currentMemory;
  next();
};

// Middleware para cache metrics
export const cacheMetrics = {
  recordHit: (keyType: string) => {
    cacheHits.inc({ key_type: keyType });
  },
  
  recordMiss: (keyType: string) => {
    cacheMisses.inc({ key_type: keyType });
  }
};

// Middleware para detectar requests suspeitos
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\.\.|\/\/)/,           // Path traversal
    /<script>/i,              // XSS
    /union.*select/i,         // SQL injection
    /\x00/,                   // Null bytes
    /\r\n|\r|\n/              // CRLF injection
  ];

  const url = req.url + JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      log.warn('Request suspeito detectado', {
        pattern: pattern.toString(),
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Capturar no Sentry como aviso
      captureException(new Error('Suspicious request detected'), {
        level: 'warning',
        extra: {
          pattern: pattern.toString(),
          url: req.url,
          method: req.method,
          ip: req.ip
        }
      });
      
      break;
    }
  }

  next();
};

// Função helper para logar queries lentas
export function logSlowQuery(query: string, duration: number, model?: string) {
  if (duration > 100) { // Mais de 100ms
    log.warn('Query lenta detectada', {
      query: query.substring(0, 200), // Truncar queries muito longas
      duration,
      model
    });
  }
}

// Performance budget monitoring
const performanceBudget = {
  maxResponseTime: 2000, // 2 segundos
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  maxCpuUsage: 80 // 80%
};

export const budgetMonitoring = setInterval(() => {
  const memoryUsage = process.memoryUsage();
  
  if (memoryUsage.heapUsed > performanceBudget.maxMemoryUsage) {
    log.error('Performance budget excedido: Memória', {
      current: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      budget: Math.round(performanceBudget.maxMemoryUsage / 1024 / 1024) + 'MB'
    });
  }
}, 60000); // Verificar a cada minuto