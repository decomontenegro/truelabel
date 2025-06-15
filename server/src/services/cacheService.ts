import { redis } from '../lib/redis';
import logger from '../utils/logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

class CacheService {
  private defaultTTL = 3600; // 1 hour
  
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
   * Get cached value
   */
  async get<T>(namespace: string, identifier: string): Promise<T | null> {
    if (!redis.isAvailable()) return null;

    const key = this.generateKey(namespace, identifier);
    
    try {
      const cached = await redis.get(key);
      if (!cached) return null;

      logger.debug('Cache hit', { namespace, identifier });
      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error('Cache get error', { error, namespace, identifier });
      return null;
    }
  }

  /**
   * Set cached value
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
      await redis.set(key, JSON.stringify(value), ttl);
      
      // Add to tags if provided
      if (options?.tags) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key);
        }
      }

      logger.debug('Cache set', { namespace, identifier, ttl });
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

export default new CacheService();