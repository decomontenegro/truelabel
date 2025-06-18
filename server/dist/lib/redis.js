"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.cache = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnectTimeout = null;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        if (env_1.config.redis.enabled && env_1.config.redis.url) {
            this.connect();
        }
    }
    connect() {
        try {
            this.client = new ioredis_1.default(env_1.config.redis.url, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                },
                retryStrategy: (times) => {
                    if (times > this.maxReconnectAttempts) {
                        console.error('❌ Max Redis reconnection attempts reached');
                        return null;
                    }
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });
            this.client.on('connect', () => {
                console.log('🔗 Redis connecting...');
            });
            this.client.on('ready', () => {
                console.log('✅ Redis connected and ready');
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });
            this.client.on('error', (err) => {
                console.error('❌ Redis error:', err.message);
                this.isConnected = false;
            });
            this.client.on('close', () => {
                console.log('🔌 Redis connection closed');
                this.isConnected = false;
            });
            this.client.on('reconnecting', () => {
                this.reconnectAttempts++;
                console.log(`🔄 Redis reconnecting... (attempt ${this.reconnectAttempts})`);
            });
        }
        catch (error) {
            console.error('❌ Failed to create Redis client:', error);
            this.client = null;
        }
    }
    isAvailable() {
        return this.isConnected && this.client !== null;
    }
    async get(key) {
        if (!this.isAvailable())
            return null;
        try {
            return await this.client.get(key);
        }
        catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isAvailable())
            return false;
        try {
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }
        catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }
    async del(key) {
        if (!this.isAvailable())
            return 0;
        try {
            const keys = Array.isArray(key) ? key : [key];
            return await this.client.del(...keys);
        }
        catch (error) {
            console.error('Redis DEL error:', error);
            return 0;
        }
    }
    async clearPattern(pattern) {
        if (!this.isAvailable())
            return 0;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0)
                return 0;
            return await this.client.del(keys);
        }
        catch (error) {
            console.error('Redis clear pattern error:', error);
            return 0;
        }
    }
    async incr(key) {
        if (!this.isAvailable())
            return null;
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error('Redis INCR error:', error);
            return null;
        }
    }
    async hset(key, field, value) {
        if (!this.isAvailable())
            return false;
        try {
            await this.client.hset(key, field, value);
            return true;
        }
        catch (error) {
            console.error('Redis HSET error:', error);
            return false;
        }
    }
    async hget(key, field) {
        if (!this.isAvailable())
            return null;
        try {
            return await this.client.hget(key, field);
        }
        catch (error) {
            console.error('Redis HGET error:', error);
            return null;
        }
    }
    async hgetall(key) {
        if (!this.isAvailable())
            return null;
        try {
            return await this.client.hgetall(key);
        }
        catch (error) {
            console.error('Redis HGETALL error:', error);
            return null;
        }
    }
    async zadd(key, score, member) {
        if (!this.isAvailable())
            return false;
        try {
            await this.client.zadd(key, score, member);
            return true;
        }
        catch (error) {
            console.error('Redis ZADD error:', error);
            return false;
        }
    }
    async zrange(key, start, stop, withScores = false) {
        if (!this.isAvailable())
            return [];
        try {
            if (withScores) {
                return await this.client.zrange(key, start, stop, 'WITHSCORES');
            }
            return await this.client.zrange(key, start, stop);
        }
        catch (error) {
            console.error('Redis ZRANGE error:', error);
            return [];
        }
    }
    async publish(channel, message) {
        if (!this.isAvailable())
            return false;
        try {
            await this.client.publish(channel, message);
            return true;
        }
        catch (error) {
            console.error('Redis PUBLISH error:', error);
            return false;
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
}
exports.redis = new RedisClient();
class CacheService {
    constructor() {
        this.memoryCache = new Map();
    }
    async get(key) {
        const redisValue = await exports.redis.get(key);
        if (redisValue) {
            try {
                return JSON.parse(redisValue);
            }
            catch {
                return redisValue;
            }
        }
        const memValue = this.memoryCache.get(key);
        if (memValue && memValue.expires > Date.now()) {
            return memValue.value;
        }
        if (memValue) {
            this.memoryCache.delete(key);
        }
        return null;
    }
    async set(key, value, ttlSeconds = 3600) {
        const serialized = JSON.stringify(value);
        await exports.redis.set(key, serialized, ttlSeconds);
        this.memoryCache.set(key, {
            value,
            expires: Date.now() + (ttlSeconds * 1000)
        });
        this.cleanupMemoryCache();
    }
    async invalidate(pattern) {
        await exports.redis.clearPattern(pattern);
        const keysToDelete = [];
        this.memoryCache.forEach((_, key) => {
            if (key.includes(pattern.replace('*', ''))) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
    }
    async getOrSet(key, fetcher, ttlSeconds = 3600) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fetcher();
        await this.set(key, value, ttlSeconds);
        return value;
    }
    async del(keys) {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        const redisDeleted = await exports.redis.del(keys);
        keysArray.forEach(key => this.memoryCache.delete(key));
        return redisDeleted;
    }
    async delPattern(pattern) {
        const redisDeleted = await exports.redis.clearPattern(pattern);
        const keysToDelete = [];
        this.memoryCache.forEach((_, key) => {
            if (key.includes(pattern.replace('*', ''))) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
        return redisDeleted;
    }
    async zadd(key, score, member) {
        return await exports.redis.zadd(key, score, member);
    }
    cleanupMemoryCache() {
        const now = Date.now();
        const keysToDelete = [];
        this.memoryCache.forEach((value, key) => {
            if (value.expires < now) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
        if (this.memoryCache.size > 1000) {
            const entries = Array.from(this.memoryCache.entries());
            entries.sort((a, b) => a[1].expires - b[1].expires);
            const toRemove = Math.floor(entries.length * 0.2);
            for (let i = 0; i < toRemove; i++) {
                this.memoryCache.delete(entries[i][0]);
            }
        }
    }
}
exports.cache = new CacheService();
exports.CacheKeys = {
    user: (id) => `user:${id}`,
    userByEmail: (email) => `user:email:${email}`,
    product: (id) => `product:${id}`,
    productList: (userId, page) => `products:${userId}:${page}`,
    productBySku: (sku) => `product:sku:${sku}`,
    validation: (id) => `validation:${id}`,
    validationQueue: () => 'validation:queue',
    analytics: (type, period) => `analytics:${type}:${period}`,
    qrScans: (qrCode) => `qr:scans:${qrCode}`,
    report: (id) => `report:${id}`,
    reportList: (productId) => `reports:${productId}`,
    laboratory: (id) => `lab:${id}`,
    laboratoryList: () => 'labs:all',
    session: (token) => `session:${token}`,
    rateLimit: (identifier, endpoint) => `rate:${identifier}:${endpoint}`,
};
exports.CacheTTL = {
    short: 300,
    medium: 3600,
    long: 86400,
    week: 604800,
};
//# sourceMappingURL=redis.js.map