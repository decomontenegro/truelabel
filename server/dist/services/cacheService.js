"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = void 0;
exports.Cacheable = Cacheable;
exports.CacheInvalidate = CacheInvalidate;
exports.CacheWarm = CacheWarm;
const redis_1 = require("../lib/redis");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
const gunzip = (0, util_1.promisify)(zlib_1.default.gunzip);
class CacheService {
    constructor() {
        this.defaultTTL = 3600;
        this.stats = { hits: 0, misses: 0 };
    }
    generateKey(namespace, identifier) {
        return `truelabel:${namespace}:${identifier}`;
    }
    generateHash(obj) {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto_1.default.createHash('md5').update(str).digest('hex');
    }
    async get(namespace, identifier, version) {
        if (!redis_1.redis.isAvailable())
            return null;
        const key = this.generateKey(namespace, identifier);
        try {
            const cached = await redis_1.redis.get(key);
            if (!cached) {
                this.stats.misses++;
                return null;
            }
            const { data, metadata } = JSON.parse(cached);
            if (version && metadata.version !== version) {
                this.stats.misses++;
                await this.delete(namespace, identifier);
                return null;
            }
            let result = data;
            if (metadata.compressed) {
                const buffer = Buffer.from(data, 'base64');
                const decompressed = await gunzip(buffer);
                result = JSON.parse(decompressed.toString());
            }
            this.stats.hits++;
            logger_1.default.debug('Cache hit', { namespace, identifier });
            return result;
        }
        catch (error) {
            logger_1.default.error('Cache get error', { error, namespace, identifier });
            this.stats.misses++;
            return null;
        }
    }
    async set(namespace, identifier, value, options) {
        if (!redis_1.redis.isAvailable())
            return;
        const key = this.generateKey(namespace, identifier);
        const ttl = options?.ttl || this.defaultTTL;
        try {
            let data = value;
            let compressed = false;
            if (options?.compress) {
                const serialized = JSON.stringify(value);
                if (serialized.length > 1024) {
                    const compressed_data = await gzip(serialized);
                    data = compressed_data.toString('base64');
                    compressed = true;
                }
            }
            const cacheData = {
                data,
                metadata: {
                    compressed,
                    version: options?.version || 1,
                    createdAt: Date.now(),
                    ttl
                }
            };
            await redis_1.redis.set(key, JSON.stringify(cacheData), ttl);
            if (options?.tags) {
                for (const tag of options.tags) {
                    await redis_1.redis.sadd(`tag:${tag}`, key);
                    await redis_1.redis.expire(`tag:${tag}`, ttl);
                }
            }
            logger_1.default.debug('Cache set', { namespace, identifier, ttl, compressed });
        }
        catch (error) {
            logger_1.default.error('Cache set error', { error, namespace, identifier });
        }
    }
    async delete(namespace, identifier) {
        if (!redis_1.redis.isAvailable())
            return;
        const key = this.generateKey(namespace, identifier);
        try {
            await redis_1.redis.del(key);
            logger_1.default.debug('Cache deleted', { namespace, identifier });
        }
        catch (error) {
            logger_1.default.error('Cache delete error', { error, namespace, identifier });
        }
    }
    async deletePattern(pattern) {
        if (!redis_1.redis.isAvailable())
            return;
        try {
            await redis_1.redis.delPattern(pattern);
            logger_1.default.debug('Cache pattern deleted', { pattern });
        }
        catch (error) {
            logger_1.default.error('Cache pattern delete error', { error, pattern });
        }
    }
    async invalidateByTags(tags) {
        if (!redis_1.redis.isAvailable())
            return;
        try {
            for (const tag of tags) {
                const keys = await redis_1.redis.smembers(`tag:${tag}`);
                if (keys.length > 0) {
                    await redis_1.redis.del(keys);
                    await redis_1.redis.del(`tag:${tag}`);
                }
            }
            logger_1.default.debug('Cache invalidated by tags', { tags });
        }
        catch (error) {
            logger_1.default.error('Cache invalidate by tags error', { error, tags });
        }
    }
    async getOrCompute(namespace, identifier, computeFn, options) {
        const cached = await this.get(namespace, identifier);
        if (cached !== null) {
            return cached;
        }
        const value = await computeFn();
        await this.set(namespace, identifier, value, options);
        return value;
    }
    async cacheQuery(queryKey, queryFn, options) {
        const namespace = 'query';
        const identifier = this.generateHash(queryKey);
        return this.getOrCompute(namespace, identifier, queryFn, options);
    }
    async clear() {
        if (!redis_1.redis.isAvailable())
            return;
        try {
            await redis_1.redis.flushdb();
            logger_1.default.info('Cache cleared');
        }
        catch (error) {
            logger_1.default.error('Cache clear error', { error });
        }
    }
    async warmUp() {
        logger_1.default.info('Cache warm up started');
        logger_1.default.info('Cache warm up completed');
    }
    async getStats() {
        const hitRate = this.stats.hits > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
            : 0;
        let size = 0;
        let keys = 0;
        if (redis_1.redis.isAvailable()) {
            try {
                const info = await redis_1.redis.info();
                const memMatch = info.match(/used_memory:(\d+)/);
                size = memMatch ? parseInt(memMatch[1]) : 0;
                keys = await redis_1.redis.dbsize();
            }
            catch (error) {
                logger_1.default.error('Failed to get redis stats', { error });
            }
        }
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            size,
            keys
        };
    }
    resetStats() {
        this.stats = { hits: 0, misses: 0 };
    }
    async mget(keys) {
        const results = new Map();
        if (!redis_1.redis.isAvailable()) {
            keys.forEach(k => results.set(`${k.namespace}:${k.identifier}`, null));
            return results;
        }
        try {
            const cacheKeys = keys.map(k => this.generateKey(k.namespace, k.identifier));
            const values = await redis_1.redis.mget(cacheKeys);
            for (let i = 0; i < keys.length; i++) {
                const key = `${keys[i].namespace}:${keys[i].identifier}`;
                if (values[i]) {
                    const { data, metadata } = JSON.parse(values[i]);
                    let result = data;
                    if (metadata.compressed) {
                        const buffer = Buffer.from(data, 'base64');
                        const decompressed = await gunzip(buffer);
                        result = JSON.parse(decompressed.toString());
                    }
                    results.set(key, result);
                    this.stats.hits++;
                }
                else {
                    results.set(key, null);
                    this.stats.misses++;
                }
            }
        }
        catch (error) {
            logger_1.default.error('Batch get error', { error });
            keys.forEach(k => {
                results.set(`${k.namespace}:${k.identifier}`, null);
                this.stats.misses++;
            });
        }
        return results;
    }
    async acquireLock(key, ttl = 5) {
        if (!redis_1.redis.isAvailable())
            return true;
        const lockKey = `lock:${key}`;
        const result = await redis_1.redis.set(lockKey, '1', ttl, 'NX');
        return result === 'OK';
    }
    async releaseLock(key) {
        if (!redis_1.redis.isAvailable())
            return;
        const lockKey = `lock:${key}`;
        await redis_1.redis.del(lockKey);
    }
    async getOrComputeWithLock(namespace, identifier, computeFn, options) {
        const cached = await this.get(namespace, identifier);
        if (cached !== null) {
            return cached;
        }
        const key = this.generateKey(namespace, identifier);
        const lockAcquired = await this.acquireLock(key);
        if (!lockAcquired) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getOrComputeWithLock(namespace, identifier, computeFn, options);
        }
        try {
            const cachedAfterLock = await this.get(namespace, identifier);
            if (cachedAfterLock !== null) {
                return cachedAfterLock;
            }
            const value = await computeFn();
            await this.set(namespace, identifier, value, options);
            return value;
        }
        finally {
            await this.releaseLock(key);
        }
    }
}
exports.CacheKeys = {
    product: (id) => ({ namespace: 'product', identifier: id }),
    productList: (params) => ({
        namespace: 'product-list',
        identifier: crypto_1.default.createHash('md5').update(JSON.stringify(params)).digest('hex')
    }),
    validation: (id) => ({ namespace: 'validation', identifier: id }),
    user: (id) => ({ namespace: 'user', identifier: id }),
    qrCode: (code) => ({ namespace: 'qr', identifier: code }),
    analytics: (key) => ({ namespace: 'analytics', identifier: key }),
    session: (token) => ({ namespace: 'session', identifier: token }),
};
exports.CacheTTL = {
    SHORT: 300,
    MEDIUM: 3600,
    LONG: 86400,
    SESSION: 604800,
};
const cacheService = new CacheService();
exports.default = cacheService;
function Cacheable(options) {
    return function (target, propertyName, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const namespace = options?.namespace || target.constructor.name;
            const identifier = `${propertyName}:${crypto_1.default.createHash('md5').update(JSON.stringify(args)).digest('hex')}`;
            return cacheService.getOrCompute(namespace, identifier, async () => originalMethod.apply(this, args), options);
        };
        return descriptor;
    };
}
function CacheInvalidate(tags) {
    return function (target, propertyName, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await originalMethod.apply(this, args);
            await cacheService.invalidateByTags(tags);
            return result;
        };
        return descriptor;
    };
}
function CacheWarm(namespace, identifier, options) {
    return function (target, propertyName, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await originalMethod.apply(this, args);
            await cacheService.set(namespace, identifier, result, options);
            return result;
        };
        return descriptor;
    };
}
//# sourceMappingURL=cacheService.js.map