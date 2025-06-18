import { redis } from '../lib/redis';
import logger from '../utils/logger';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
  compress?: boolean; // Whether to compress large data
  version?: number; // Cache version for invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

class CacheService {
  private defaultTTL = 3600; // 1 hour
  private stats = { hits: 0, misses: 0 };
  
  /**
   * Generate cache key with namespace
   */
  private generateKey(namespace: string, identifier: string): string {
    return `truelabel:${namespace}:${identifier}`;
  }

  /**
   * Generate hash for complex objects
   */
  private generateHash(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Get cached value with decompression support
   */
  async get<T>(namespace: string, identifier: string, version?: number): Promise<T | null> {
    if (!redis.isAvailable()) return null;

    const key = this.generateKey(namespace, identifier);
    
    try {
      const cached = await redis.get(key);
      if (!cached) {
        this.stats.misses++;
        return null;
      }

      // Parse metadata and data
      const { data, metadata } = JSON.parse(cached);
      
      // Check version if provided
      if (version && metadata.version !== version) {
        this.stats.misses++;
        await this.delete(namespace, identifier);
        return null;
      }

      // Decompress if needed
      let result = data;
      if (metadata.compressed) {
        const buffer = Buffer.from(data, 'base64');
        const decompressed = await gunzip(buffer);
        result = JSON.parse(decompressed.toString());
      }

      this.stats.hits++;
      logger.debug('Cache hit', { namespace, identifier });
      return result as T;
    } catch (error) {
      logger.error('Cache get error', { error, namespace, identifier });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached value with compression support
   */
  async set<T>(
    namespace: string, 
    identifier: string, 
    value: T, 
    options?: CacheOptions
  ): Promise<void> {
    if (!redis.isAvailable()) return;

    const key = this.generateKey(namespace, identifier);
    const ttl = options?.ttl || this.defaultTTL;

    try {
      let data = value;
      let compressed = false;

      // Compress if requested and data is large enough
      if (options?.compress) {
        const serialized = JSON.stringify(value);
        if (serialized.length > 1024) { // Compress if > 1KB
          const compressed_data = await gzip(serialized);
          data = compressed_data.toString('base64') as any;
          compressed = true;
        }
      }

      // Store with metadata
      const cacheData = {
        data,
        metadata: {
          compressed,
          version: options?.version || 1,
          createdAt: Date.now(),
          ttl
        }
      };

      await redis.set(key, JSON.stringify(cacheData), ttl);
      
      // Add to tags if provided
      if (options?.tags) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key);
          // Set expiry on tag set
          await redis.expire(`tag:${tag}`, ttl);
        }
      }

      logger.debug('Cache set', { namespace, identifier, ttl, compressed });
    } catch (error) {
      logger.error('Cache set error', { error, namespace, identifier });
    }
  }

  /**
   * Delete cached value
   */
  async delete(namespace: string, identifier: string): Promise<void> {
    if (!redis.isAvailable()) return;

    const key = this.generateKey(namespace, identifier);

    try {
      await redis.del(key);
      logger.debug('Cache deleted', { namespace, identifier });
    } catch (error) {
      logger.error('Cache delete error', { error, namespace, identifier });
    }
  }

  /**
   * Delete all cached values by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!redis.isAvailable()) return;

    try {
      await redis.delPattern(pattern);
      logger.debug('Cache pattern deleted', { pattern });
    } catch (error) {
      logger.error('Cache pattern delete error', { error, pattern });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!redis.isAvailable()) return;

    try {
      for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await redis.del(keys);
          await redis.del(`tag:${tag}`);
        }
      }
      logger.debug('Cache invalidated by tags', { tags });
    } catch (error) {
      logger.error('Cache invalidate by tags error', { error, tags });
    }
  }

  /**
   * Cache aside pattern - get or compute
   */
  async getOrCompute<T>(
    namespace: string,
    identifier: string,
    computeFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(namespace, identifier);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    await this.set(namespace, identifier, value, options);

    return value;
  }

  /**
   * Cache query results
   */
  async cacheQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const namespace = 'query';
    const identifier = this.generateHash(queryKey);

    return this.getOrCompute(namespace, identifier, queryFn, options);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!redis.isAvailable()) return;

    try {
      await redis.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error });
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(): Promise<void> {
    logger.info('Cache warm up started');
    
    // Add specific warm up logic here
    // Example: preload active products, recent validations, etc.
    
    logger.info('Cache warm up completed');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const hitRate = this.stats.hits > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    let size = 0;
    let keys = 0;

    if (redis.isAvailable()) {
      try {
        const info = await redis.info();
        const memMatch = info.match(/used_memory:(\d+)/);
        size = memMatch ? parseInt(memMatch[1]) : 0;
        keys = await redis.dbsize();
      } catch (error) {
        logger.error('Failed to get redis stats', { error });
      }
    }

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size,
      keys
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Batch get multiple values
   */
  async mget<T>(keys: Array<{ namespace: string; identifier: string }>): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    if (!redis.isAvailable()) {
      keys.forEach(k => results.set(`${k.namespace}:${k.identifier}`, null));
      return results;
    }

    try {
      const cacheKeys = keys.map(k => this.generateKey(k.namespace, k.identifier));
      const values = await redis.mget(cacheKeys);
      
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
        } else {
          results.set(key, null);
          this.stats.misses++;
        }
      }
    } catch (error) {
      logger.error('Batch get error', { error });
      keys.forEach(k => {
        results.set(`${k.namespace}:${k.identifier}`, null);
        this.stats.misses++;
      });
    }

    return results;
  }

  /**
   * Lock mechanism for preventing cache stampede
   */
  async acquireLock(key: string, ttl: number = 5): Promise<boolean> {
    if (!redis.isAvailable()) return true;

    const lockKey = `lock:${key}`;
    const result = await redis.set(lockKey, '1', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    if (!redis.isAvailable()) return;

    const lockKey = `lock:${key}`;
    await redis.del(lockKey);
  }

  /**
   * Get or compute with lock to prevent cache stampede
   */
  async getOrComputeWithLock<T>(
    namespace: string,
    identifier: string,
    computeFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(namespace, identifier);
    if (cached !== null) {
      return cached;
    }

    const key = this.generateKey(namespace, identifier);
    const lockAcquired = await this.acquireLock(key);

    if (!lockAcquired) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getOrComputeWithLock(namespace, identifier, computeFn, options);
    }

    try {
      // Double check after acquiring lock
      const cachedAfterLock = await this.get<T>(namespace, identifier);
      if (cachedAfterLock !== null) {
        return cachedAfterLock;
      }

      // Compute value
      const value = await computeFn();

      // Store in cache
      await this.set(namespace, identifier, value, options);

      return value;
    } finally {
      await this.releaseLock(key);
    }
  }
}

// Cache key generators for consistency
export const CacheKeys = {
  product: (id: string) => ({ namespace: 'product', identifier: id }),
  productList: (params: any) => ({ 
    namespace: 'product-list', 
    identifier: crypto.createHash('md5').update(JSON.stringify(params)).digest('hex') 
  }),
  validation: (id: string) => ({ namespace: 'validation', identifier: id }),
  user: (id: string) => ({ namespace: 'user', identifier: id }),
  qrCode: (code: string) => ({ namespace: 'qr', identifier: code }),
  analytics: (key: string) => ({ namespace: 'analytics', identifier: key }),
  session: (token: string) => ({ namespace: 'session', identifier: token }),
};

// TTL configurations
export const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
  SESSION: 604800, // 7 days
};

const cacheService = new CacheService();
export default cacheService;

// Decorators for easy caching
export function Cacheable(options?: CacheOptions & { namespace?: string }) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const namespace = options?.namespace || target.constructor.name;
      const identifier = `${propertyName}:${crypto.createHash('md5').update(JSON.stringify(args)).digest('hex')}`;

      return cacheService.getOrCompute(
        namespace,
        identifier,
        async () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

// Cache invalidation decorator
export function CacheInvalidate(tags: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      await cacheService.invalidateByTags(tags);
      return result;
    };

    return descriptor;
  };
}

// Cache warming decorator
export function CacheWarm(namespace: string, identifier: string, options?: CacheOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      await cacheService.set(namespace, identifier, result, options);
      return result;
    };

    return descriptor;
  };
}