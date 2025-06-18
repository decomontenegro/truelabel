"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetMonitoring = exports.securityMonitoring = exports.cacheMetrics = exports.memoryMonitoring = exports.sentryPerformance = exports.connectionTracking = exports.performanceMonitoring = void 0;
exports.logSlowQuery = logSlowQuery;
const response_time_1 = __importDefault(require("response-time"));
const metrics_1 = require("../lib/metrics");
const logger_1 = require("../lib/logger");
const node_1 = require("@sentry/node");
const sentry_1 = require("../lib/sentry");
exports.performanceMonitoring = (0, response_time_1.default)((req, res, time) => {
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();
    metrics_1.httpRequestTotal.inc({ method, route, status_code: statusCode });
    metrics_1.httpRequestDuration.observe({ method, route, status_code: statusCode }, time / 1000);
    metrics_1.apiResponseTime.observe({ endpoint: route }, time / 1000);
    if (time > 1000) {
        logger_1.log.warn('Requisição lenta detectada', {
            method,
            route,
            duration: time,
            statusCode,
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
    }
    logger_1.log.http('HTTP Request', {
        method,
        route,
        statusCode,
        duration: time,
        contentLength: res.get('content-length'),
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: req.user?.id
    });
});
const connectionTracking = (req, res, next) => {
    metrics_1.activeConnections.inc({ type: 'http' });
    res.on('finish', () => {
        metrics_1.activeConnections.dec({ type: 'http' });
    });
    res.on('close', () => {
        metrics_1.activeConnections.dec({ type: 'http' });
    });
    next();
};
exports.connectionTracking = connectionTracking;
const sentryPerformance = (req, res, next) => {
    const transaction = (0, sentry_1.startTransaction)({
        op: 'http.server',
        name: `${req.method} ${req.route?.path || req.path}`,
        data: {
            url: req.url,
            method: req.method,
            query: req.query,
            ip: req.ip
        }
    });
    if (req.user) {
        (0, node_1.setUser)({
            id: req.user.id,
            email: req.user.email
        });
    }
    res.on('finish', () => {
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();
    });
    next();
};
exports.sentryPerformance = sentryPerformance;
let lastMemoryUsage = process.memoryUsage();
let memoryLeakCounter = 0;
const memoryMonitoring = (_req, _res, next) => {
    const currentMemory = process.memoryUsage();
    const heapDiff = currentMemory.heapUsed - lastMemoryUsage.heapUsed;
    if (heapDiff > 50 * 1024 * 1024) {
        memoryLeakCounter++;
        if (memoryLeakCounter > 5) {
            logger_1.log.error('Possível memory leak detectado', {
                heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024) + 'MB',
                heapDiff: Math.round(heapDiff / 1024 / 1024) + 'MB',
                rss: Math.round(currentMemory.rss / 1024 / 1024) + 'MB'
            });
            (0, node_1.captureException)(new Error('Possible memory leak detected'), {
                extra: {
                    heapUsed: currentMemory.heapUsed,
                    heapDiff,
                    rss: currentMemory.rss
                }
            });
            memoryLeakCounter = 0;
        }
    }
    else if (heapDiff < 0) {
        memoryLeakCounter = 0;
    }
    lastMemoryUsage = currentMemory;
    next();
};
exports.memoryMonitoring = memoryMonitoring;
exports.cacheMetrics = {
    recordHit: (keyType) => {
        metrics_1.cacheHits.inc({ key_type: keyType });
    },
    recordMiss: (keyType) => {
        metrics_1.cacheMisses.inc({ key_type: keyType });
    }
};
const securityMonitoring = (req, res, next) => {
    const suspiciousPatterns = [
        /(\.\.|\/\/)/,
        /<script>/i,
        /union.*select/i,
        /\x00/,
        /\r\n|\r|\n/
    ];
    const url = req.url + JSON.stringify(req.body || {});
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
            logger_1.log.warn('Request suspeito detectado', {
                pattern: pattern.toString(),
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
            (0, node_1.captureException)(new Error('Suspicious request detected'), {
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
exports.securityMonitoring = securityMonitoring;
function logSlowQuery(query, duration, model) {
    if (duration > 100) {
        logger_1.log.warn('Query lenta detectada', {
            query: query.substring(0, 200),
            duration,
            model
        });
    }
}
const performanceBudget = {
    maxResponseTime: 2000,
    maxMemoryUsage: 512 * 1024 * 1024,
    maxCpuUsage: 80
};
exports.budgetMonitoring = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > performanceBudget.maxMemoryUsage) {
        logger_1.log.error('Performance budget excedido: Memória', {
            current: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            budget: Math.round(performanceBudget.maxMemoryUsage / 1024 / 1024) + 'MB'
        });
    }
}, 60000);
//# sourceMappingURL=performance.js.map