"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const reports_1 = __importDefault(require("./routes/reports"));
const validations_1 = __importDefault(require("./routes/validations"));
const qr_1 = __importDefault(require("./routes/qr"));
const laboratories_1 = __importDefault(require("./routes/laboratories"));
const upload_1 = __importDefault(require("./routes/upload"));
const public_1 = __importDefault(require("./routes/public"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const seals_1 = __importDefault(require("./routes/seals"));
const certifications_1 = __importDefault(require("./routes/certifications"));
const validationQueue_1 = __importDefault(require("./routes/validationQueue"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const privacy_1 = __importDefault(require("./routes/privacy"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const status_1 = __importDefault(require("./routes/status"));
const performance_1 = require("./middleware/performance");
const security_middleware_1 = require("./middlewares/security.middleware");
const error_handler_middleware_1 = require("./middlewares/error-handler.middleware");
const logger_1 = require("./utils/logger");
const env_1 = __importStar(require("./config/env"));
const websocketService_1 = __importDefault(require("./services/websocketService"));
const cacheWarmingService_1 = __importDefault(require("./services/cacheWarmingService"));
const cacheService_1 = __importDefault(require("./services/cacheService"));
(0, env_1.validateConfig)();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use(security_middleware_1.securityHeaders);
app.use(logger_1.requestLogger);
app.use(performance_1.performanceMonitoring);
app.use(performance_1.connectionTracking);
app.use(performance_1.sentryPerformance);
app.use(performance_1.memoryMonitoring);
app.use(performance_1.securityMonitoring);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.default.rateLimit.windowMs,
    max: env_1.default.rateLimit.maxRequests,
    message: {
        error: 'Muitas tentativas. Tente novamente mais tarde.'
    },
    skip: (req) => {
        return env_1.default.isDevelopment;
    }
});
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(limiter);
app.use((0, cors_1.default)({
    origin: env_1.default.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
const maxSize = `${Math.floor(env_1.default.upload.maxSize / 1024 / 1024)}mb`;
app.use(express_1.default.json({ limit: maxSize }));
app.use(express_1.default.urlencoded({ extended: true, limit: maxSize }));
app.use('/uploads', express_1.default.static(env_1.default.upload.path));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, swagger_1.swaggerUiOptions));
const metrics_2 = require("./lib/metrics");
app.get('/metrics', (0, metrics_2.metricsEndpoint)());
app.get('/health', async (req, res) => {
    try {
        const { checkDatabaseConnection } = await Promise.resolve().then(() => __importStar(require('./lib/prisma')));
        const dbHealthy = await checkDatabaseConnection();
        const { redis } = await Promise.resolve().then(() => __importStar(require('./lib/redis')));
        const redisHealthy = redis.isAvailable();
        res.json({
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: env_1.default.NODE_ENV,
            database: dbHealthy ? 'connected' : 'disconnected',
            services: {
                api: 'operational',
                database: dbHealthy ? 'operational' : 'down',
                websocket: 'operational',
                redis: redisHealthy ? 'operational' : 'down'
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Failed to check system health'
        });
    }
});
app.use('/api', security_middleware_1.rateLimiters.general);
app.use('/api/v1/auth', security_middleware_1.rateLimiters.auth, auth_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/reports', reports_1.default);
app.use('/api/v1/validations', validations_1.default);
app.use('/api/v1/validations', validationQueue_1.default);
app.use('/api/v1/qr', qr_1.default);
app.use('/api/v1/laboratories', laboratories_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/analytics', analytics_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1', seals_1.default);
app.use('/api/v1', certifications_1.default);
app.use('/api/v1/monitoring', monitoring_1.default);
app.use('/api/v1/privacy', privacy_1.default);
app.use('/api/v1/metrics', metrics_1.default);
app.use('/api', status_1.default);
app.use('/public', public_1.default);
app.use(error_handler_middleware_1.notFoundHandler);
app.use(error_handler_middleware_1.errorHandler);
websocketService_1.default.initialize(server);
server.listen(env_1.default.PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${env_1.default.PORT}`);
    console.log(`📊 Ambiente: ${env_1.default.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${env_1.default.PORT}/health`);
    console.log(`🔌 WebSocket habilitado`);
    if (env_1.default.redis.enabled) {
        console.log('🔥 Iniciando cache warming...');
        cacheWarmingService_1.default.start();
        cacheService_1.default.warmUp();
    }
    console.log(`📈 Métricas: http://localhost:${env_1.default.PORT}/metrics`);
    console.log(`📚 API Docs: http://localhost:${env_1.default.PORT}/api-docs`);
    console.log(`📋 Dashboard: http://localhost:${env_1.default.PORT}/api/monitoring/dashboard`);
    Promise.resolve().then(() => __importStar(require('./services/performanceService'))).then(({ default: performanceService }) => {
        performanceService.startPeriodicMonitoring(5);
    });
    (0, env_1.logConfig)();
});
process.on('SIGTERM', async () => {
    console.log('🔄 Recebido SIGTERM, encerrando servidor...');
    websocketService_1.default.shutdown();
    const { redis } = await Promise.resolve().then(() => __importStar(require('./lib/redis')));
    await redis.disconnect();
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('🔄 Recebido SIGINT, encerrando servidor...');
    websocketService_1.default.shutdown();
    const { redis } = await Promise.resolve().then(() => __importStar(require('./lib/redis')));
    await redis.disconnect();
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map