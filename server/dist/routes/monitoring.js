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
const auth_1 = require("../middleware/auth");
const performanceService_1 = __importDefault(require("../services/performanceService"));
const metrics_1 = require("../lib/metrics");
const logger_1 = require("../lib/logger");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
router.get('/dashboard', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const report = await performanceService_1.default.generatePerformanceReport();
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/system', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const metrics = await performanceService_1.default.getSystemMetrics();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/database', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const metrics = await performanceService_1.default.getDatabaseMetrics();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/alerts', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const alerts = await performanceService_1.default.checkPerformanceAlerts();
        res.json({
            success: true,
            hasAlerts: alerts.length > 0,
            alerts
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/logs', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { level = 'info', limit = 100 } = req.query;
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/slow-queries', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/cache', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { redis, cache } = await Promise.resolve().then(() => __importStar(require('../lib/redis')));
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
        const info = {
            available: true,
        };
        res.json({
            success: true,
            data: info
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics', (0, metrics_1.metricsEndpoint)());
router.get('/health/detailed', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const checks = {
            api: true,
            database: false,
            redis: false,
            filesystem: true
        };
        try {
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            checks.database = true;
        }
        catch (error) {
            logger_1.log.error('Health check: Database failed', error);
        }
        try {
            const { redis } = await Promise.resolve().then(() => __importStar(require('../lib/redis')));
            checks.redis = redis.isAvailable();
        }
        catch (error) {
            logger_1.log.error('Health check: Redis failed', error);
        }
        const allHealthy = Object.values(checks).every(check => check === true);
        res.status(allHealthy ? 200 : 503).json({
            success: true,
            healthy: allHealthy,
            checks,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=monitoring.js.map