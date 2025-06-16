import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';

// Importar Sentry
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './lib/sentry';

// Importar Swagger
import { swaggerSpec, swaggerUiOptions } from './config/swagger';

// Importar rotas
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import reportRoutes from './routes/reports';
import validationRoutes from './routes/validations';
import qrRoutes from './routes/qr';
import laboratoryRoutes from './routes/laboratories';
import uploadRoutes from './routes/upload';
import publicRoutes from './routes/public';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import sealRoutes from './routes/seals';
import certificationRoutes from './routes/certifications';
import validationQueueRoutes from './routes/validationQueue';
import monitoringRoutes from './routes/monitoring';
import privacyRoutes from './routes/privacy';
import metricsRoutes from './routes/metrics';

// Importar middlewares
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { 
  performanceMonitoring, 
  connectionTracking, 
  sentryPerformance, 
  memoryMonitoring,
  securityMonitoring
} from './middleware/performance';
import { securityHeaders, rateLimiters } from './middlewares/security.middleware';
import { errorHandler as enhancedErrorHandler, notFoundHandler } from './middlewares/error-handler.middleware';
import { requestLogger } from './utils/logger';

// Importar configuração
import config, { validateConfig, logConfig } from './config/env';

// Importar serviços
import websocketService from './services/websocketService';
import analyticsEventService from './services/analyticsEventService';
import cacheWarmingService from './services/cacheWarmingService';
import cacheService from './services/cacheService';

// Validar configuração
validateConfig();

const app = express();
const server = createServer(app);

// Inicializar Sentry - TEMPORARIAMENTE DESABILITADO
// initSentry(app);

// Sentry request handler (deve ser o primeiro middleware) - TEMPORARIAMENTE DESABILITADO
// app.use(sentryRequestHandler());
// app.use(sentryTracingHandler());

// Middlewares de segurança aprimorados
app.use(securityHeaders);
app.use(requestLogger);

// Middlewares de performance
app.use(performanceMonitoring);
app.use(connectionTracking);
app.use(sentryPerformance);
app.use(memoryMonitoring);
app.use(securityMonitoring);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Muitas tentativas. Tente novamente mais tarde.'
  },
  skip: (req) => {
    // Pular rate limiting em desenvolvimento
    return config.isDevelopment;
  }
});

// Middlewares globais
app.use(helmet());
app.use(compression());
app.use(limiter);

// CORS - Permitir múltiplas origens para desenvolvimento
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
const maxSize = `${Math.floor(config.upload.maxSize / 1024 / 1024)}mb`;
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(config.upload.path));

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Métricas do Prometheus
import { metricsEndpoint } from './lib/metrics';
app.get('/metrics', metricsEndpoint());

// Health check
app.get('/health', async (req, res) => {
  try {
    // Verifica conexão com o banco
    const { checkDatabaseConnection } = await import('./lib/prisma');
    const dbHealthy = await checkDatabaseConnection();
    
    // Verifica status do Redis
    const { redis } = await import('./lib/redis');
    const redisHealthy = redis.isAvailable();
    
    res.json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
      services: {
        api: 'operational',
        database: dbHealthy ? 'operational' : 'down',
        websocket: 'operational',
        redis: redisHealthy ? 'operational' : 'down'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to check system health'
    });
  }
});

// Rotas da API com rate limiting específico
app.use('/api', rateLimiters.general);
app.use('/api/v1/auth', rateLimiters.auth, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/validations', validationRoutes);
app.use('/api/v1/validations', validationQueueRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/laboratories', laboratoryRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1', sealRoutes);
app.use('/api/v1', certificationRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/privacy', privacyRoutes);
app.use('/api/v1/metrics', metricsRoutes);

// Rotas públicas (sem prefixo /api para facilitar acesso)
app.use('/public', publicRoutes);

// Middleware de erro 404 aprimorado
app.use(notFoundHandler);

// Sentry error handler (deve ser antes do errorHandler customizado) - TEMPORARIAMENTE DESABILITADO
// app.use(sentryErrorHandler());

// Middleware de tratamento de erros aprimorado
app.use(enhancedErrorHandler);

// Inicializar WebSocket
websocketService.initialize(server);

// Iniciar servidor
server.listen(config.PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${config.PORT}`);
  console.log(`📊 Ambiente: ${config.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${config.PORT}/health`);
  console.log(`🔌 WebSocket habilitado`);

  // Iniciar cache warming se Redis estiver habilitado
  if (config.redis.enabled) {
    console.log('🔥 Iniciando cache warming...');
    cacheWarmingService.start();
    cacheService.warmUp();
  }
  
  // Log de endpoints importantes
  console.log(`📈 Métricas: http://localhost:${config.PORT}/metrics`);
  console.log(`📚 API Docs: http://localhost:${config.PORT}/api-docs`);
  console.log(`📋 Dashboard: http://localhost:${config.PORT}/api/monitoring/dashboard`);
  
  // Iniciar monitoramento periódico
  import('./services/performanceService').then(({ default: performanceService }) => {
    performanceService.startPeriodicMonitoring(5); // A cada 5 minutos
  });

  // Log da configuração em desenvolvimento
  logConfig();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Recebido SIGTERM, encerrando servidor...');
  websocketService.shutdown();
  
  // Desconectar Redis
  const { redis } = await import('./lib/redis');
  await redis.disconnect();
  
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 Recebido SIGINT, encerrando servidor...');
  websocketService.shutdown();
  
  // Desconectar Redis
  const { redis } = await import('./lib/redis');
  await redis.disconnect();
  
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

export default app;
