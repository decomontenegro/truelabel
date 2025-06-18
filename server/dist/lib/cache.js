"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = exports.CacheKeys = exports.CacheTTL = void 0;
const redis_1 = require("./redis");
exports.CacheTTL = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    EXTRA_LONG: 21600,
    DAILY: 86400,
    WEEKLY: 604800,
    SESSION: 86400,
};
exports.CacheKeys = {
    user: (id) => `user:${id}`,
    userProfile: (id) => `user:profile:${id}`,
    userPermissions: (id) => `user:permissions:${id}`,
    userNotifications: (id) => `user:notifications:${id}`,
    product: (id) => `product:${id}`,
    productList: (brandId, page, limit) => `products:${brandId}:${page}:${limit}`,
    productBySlug: (slug) => `product:slug:${slug}`,
    productQR: (productId) => `product:qr:${productId}`,
    validation: (id) => `validation:${id}`,
    validationByCode: (code) => `validation:code:${code}`,
    validationStats: (brandId) => `validation:stats:${brandId}`,
    report: (id) => `report:${id}`,
    reportList: (brandId, page) => `reports:${brandId}:${page}`,
    analytics: {
        qrScans: (productId, period) => `analytics:qr:${productId}:${period}`,
        productPerformance: (brandId, period) => `analytics:performance:${brandId}:${period}`,
        consumerInsights: (brandId) => `analytics:insights:${brandId}`,
        dashboard: (brandId) => `analytics:dashboard:${brandId}`,
    },
    smartLabel: (productId) => `smartlabel:${productId}`,
    certification: (id) => `certification:${id}`,
    certificationsByProduct: (productId) => `certifications:product:${productId}`,
    laboratory: (id) => `laboratory:${id}`,
    laboratoryList: () => `laboratories:all`,
    rateLimit: {
        api: (ip, endpoint) => `rate:api:${ip}:${endpoint}`,
        login: (email) => `rate:login:${email}`,
        qrScan: (ip) => `rate:qr:${ip}`,
    },
    session: (id) => `session:${id}`,
    temp: {
        emailVerification: (token) => `temp:email:${token}`,
        passwordReset: (token) => `temp:reset:${token}`,
        qrGeneration: (jobId) => `temp:qr:${jobId}`,
    },
};
class CacheService {
    constructor() {
        this.taggedKeys = new Map();
    }
    async get(key, fallback, ttl) {
        const cached = await redis_1.cache.get(key);
        if (cached !== null) {
            return cached;
        }
        if (!fallback) {
            return null;
        }
        try {
            const value = await fallback();
            if (value !== null && value !== undefined) {
                await redis_1.cache.set(key, value, ttl);
            }
            return value;
        }
        catch (error) {
            console.error(`Error executing cache fallback for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        await redis_1.cache.set(key, value, ttl);
        return true;
    }
    async del(key) {
        return await redis_1.cache.del(key);
    }
    async clearPattern(pattern) {
        return await redis_1.cache.delPattern(pattern);
    }
    async delPattern(pattern) {
        return await this.clearPattern(pattern);
    }
    async invalidateUser(userId) {
        const keys = [
            exports.CacheKeys.user(userId),
            exports.CacheKeys.userProfile(userId),
            exports.CacheKeys.userPermissions(userId),
            exports.CacheKeys.userNotifications(userId),
        ];
        await this.del(keys);
    }
    async invalidateProduct(productId, brandId) {
        const keys = [
            exports.CacheKeys.product(productId),
            exports.CacheKeys.productQR(productId),
            exports.CacheKeys.smartLabel(productId),
            exports.CacheKeys.certificationsByProduct(productId),
        ];
        await this.del(keys);
        if (brandId) {
            await this.clearPattern(`products:${brandId}:*`);
        }
        await this.clearPattern(`analytics:*:${productId}:*`);
    }
    async invalidateValidation(validationId, code, brandId) {
        const keys = [exports.CacheKeys.validation(validationId)];
        if (code) {
            keys.push(exports.CacheKeys.validationByCode(code));
        }
        if (brandId) {
            keys.push(exports.CacheKeys.validationStats(brandId));
        }
        await this.del(keys);
    }
    async invalidateReport(reportId, brandId) {
        await this.del(exports.CacheKeys.report(reportId));
        if (brandId) {
            await this.clearPattern(`reports:${brandId}:*`);
        }
    }
    async invalidateAnalytics(brandId) {
        await this.clearPattern(`analytics:*:${brandId}:*`);
        await this.del(exports.CacheKeys.analytics.dashboard(brandId));
        await this.del(exports.CacheKeys.analytics.consumerInsights(brandId));
    }
    async invalidateLaboratory(labId) {
        if (labId) {
            await this.del(exports.CacheKeys.laboratory(labId));
        }
        await this.del(exports.CacheKeys.laboratoryList());
    }
    async remember(key, ttl, callback) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const result = await callback();
        await this.set(key, result, ttl);
        return result;
    }
    async setTagged(key, value, tags, ttl) {
        const result = await this.set(key, value, ttl);
        tags.forEach(tag => {
            if (!this.taggedKeys.has(tag)) {
                this.taggedKeys.set(tag, new Set());
            }
            this.taggedKeys.get(tag).add(key);
        });
        return result;
    }
    async invalidateTags(tags) {
        const keysToDelete = [];
        tags.forEach(tag => {
            const keys = this.taggedKeys.get(tag);
            if (keys) {
                keys.forEach(key => keysToDelete.push(key));
                this.taggedKeys.delete(tag);
            }
        });
        if (keysToDelete.length > 0) {
            await this.del(keysToDelete);
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.js.map