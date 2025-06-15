import { cache as redisCache } from './redis';

/**
 * Cache TTL configurations (in seconds)
 */
export const CacheTTL = {
  // Short-lived cache (5 minutes)
  SHORT: 300,
  
  // Medium cache (30 minutes)
  MEDIUM: 1800,
  
  // Long cache (1 hour)
  LONG: 3600,
  
  // Extra long cache (6 hours)
  EXTRA_LONG: 21600,
  
  // Daily cache (24 hours)
  DAILY: 86400,
  
  // Weekly cache (7 days)
  WEEKLY: 604800,
  
  // Session default (24 hours)
  SESSION: 86400,
} as const;

/**
 * Cache key generators
 */
export const CacheKeys = {
  // User-related keys
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userPermissions: (id: string) => `user:permissions:${id}`,
  userNotifications: (id: string) => `user:notifications:${id}`,
  
  // Product-related keys
  product: (id: string) => `product:${id}`,
  productList: (brandId: string, page: number, limit: number) => 
    `products:${brandId}:${page}:${limit}`,
  productBySlug: (slug: string) => `product:slug:${slug}`,
  productQR: (productId: string) => `product:qr:${productId}`,
  
  // Validation-related keys
  validation: (id: string) => `validation:${id}`,
  validationByCode: (code: string) => `validation:code:${code}`,
  validationStats: (brandId: string) => `validation:stats:${brandId}`,
  
  // Report-related keys
  report: (id: string) => `report:${id}`,
  reportList: (brandId: string, page: number) => `reports:${brandId}:${page}`,
  
  // Analytics-related keys
  analytics: {
    qrScans: (productId: string, period: string) => `analytics:qr:${productId}:${period}`,
    productPerformance: (brandId: string, period: string) => 
      `analytics:performance:${brandId}:${period}`,
    consumerInsights: (brandId: string) => `analytics:insights:${brandId}`,
    dashboard: (brandId: string) => `analytics:dashboard:${brandId}`,
  },
  
  // SmartLabel keys
  smartLabel: (productId: string) => `smartlabel:${productId}`,
  
  // Certification keys
  certification: (id: string) => `certification:${id}`,
  certificationsByProduct: (productId: string) => `certifications:product:${productId}`,
  
  // Laboratory keys
  laboratory: (id: string) => `laboratory:${id}`,
  laboratoryList: () => `laboratories:all`,
  
  // Rate limiting keys
  rateLimit: {
    api: (ip: string, endpoint: string) => `rate:api:${ip}:${endpoint}`,
    login: (email: string) => `rate:login:${email}`,
    qrScan: (ip: string) => `rate:qr:${ip}`,
  },
  
  // Session keys
  session: (id: string) => `session:${id}`,
  
  // Temporary keys
  temp: {
    emailVerification: (token: string) => `temp:email:${token}`,
    passwordReset: (token: string) => `temp:reset:${token}`,
    qrGeneration: (jobId: string) => `temp:qr:${jobId}`,
  },
} as const;

/**
 * Cache service wrapper with additional functionality
 */
export class CacheService {
  /**
   * Get value from cache with optional fallback
   */
  async get<T>(
    key: string, 
    fallback?: () => Promise<T>, 
    ttl?: number
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await redisCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // If no fallback, return null
    if (!fallback) {
      return null;
    }
    
    // Execute fallback and cache the result
    try {
      const value = await fallback();
      if (value !== null && value !== undefined) {
        await redisCache.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Error executing cache fallback for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    await redisCache.set(key, value, ttl);
    return true;
  }
  
  /**
   * Delete from cache
   */
  async del(key: string | string[]): Promise<number> {
    return await redisCache.del(key);
  }
  
  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    return await redisCache.delPattern(pattern);
  }
  
  /**
   * Delete by pattern (alias for clearPattern)
   */
  async delPattern(pattern: string): Promise<number> {
    return await this.clearPattern(pattern);
  }
  
  /**
   * Invalidate user-related cache
   */
  async invalidateUser(userId: string): Promise<void> {
    const keys = [
      CacheKeys.user(userId),
      CacheKeys.userProfile(userId),
      CacheKeys.userPermissions(userId),
      CacheKeys.userNotifications(userId),
    ];
    await this.del(keys);
  }
  
  /**
   * Invalidate product-related cache
   */
  async invalidateProduct(productId: string, brandId?: string): Promise<void> {
    const keys = [
      CacheKeys.product(productId),
      CacheKeys.productQR(productId),
      CacheKeys.smartLabel(productId),
      CacheKeys.certificationsByProduct(productId),
    ];
    
    await this.del(keys);
    
    // Clear product list cache for the brand
    if (brandId) {
      await this.clearPattern(`products:${brandId}:*`);
    }
    
    // Clear analytics cache
    await this.clearPattern(`analytics:*:${productId}:*`);
  }
  
  /**
   * Invalidate validation-related cache
   */
  async invalidateValidation(validationId: string, code?: string, brandId?: string): Promise<void> {
    const keys = [CacheKeys.validation(validationId)];
    
    if (code) {
      keys.push(CacheKeys.validationByCode(code));
    }
    
    if (brandId) {
      keys.push(CacheKeys.validationStats(brandId));
    }
    
    await this.del(keys);
  }
  
  /**
   * Invalidate report-related cache
   */
  async invalidateReport(reportId: string, brandId?: string): Promise<void> {
    await this.del(CacheKeys.report(reportId));
    
    if (brandId) {
      await this.clearPattern(`reports:${brandId}:*`);
    }
  }
  
  /**
   * Invalidate all analytics cache for a brand
   */
  async invalidateAnalytics(brandId: string): Promise<void> {
    await this.clearPattern(`analytics:*:${brandId}:*`);
    await this.del(CacheKeys.analytics.dashboard(brandId));
    await this.del(CacheKeys.analytics.consumerInsights(brandId));
  }
  
  /**
   * Invalidate laboratory cache
   */
  async invalidateLaboratory(labId?: string): Promise<void> {
    if (labId) {
      await this.del(CacheKeys.laboratory(labId));
    }
    await this.del(CacheKeys.laboratoryList());
  }
  
  /**
   * Remember function result with cache
   */
  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await callback();
    await this.set(key, result, ttl);
    return result;
  }
  
  /**
   * Cache with tags for grouped invalidation
   */
  private taggedKeys: Map<string, Set<string>> = new Map();
  
  async setTagged<T>(
    key: string, 
    value: T, 
    tags: string[], 
    ttl?: number
  ): Promise<boolean> {
    // Store the cache
    const result = await this.set(key, value, ttl);
    
    // Track tags
    tags.forEach(tag => {
      if (!this.taggedKeys.has(tag)) {
        this.taggedKeys.set(tag, new Set());
      }
      this.taggedKeys.get(tag)!.add(key);
    });
    
    return result;
  }
  
  async invalidateTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];
    
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

// Export singleton instance
export const cacheService = new CacheService();