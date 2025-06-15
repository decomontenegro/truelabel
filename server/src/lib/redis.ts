import Redis from 'ioredis';
import { config } from '../config/env';

/**
 * Cliente Redis singleton com reconnect automático
 */
class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;

  constructor() {
    if (config.redis.enabled && config.redis.url) {
      this.connect();
    }
  }

  private connect() {
    try {
      this.client = new Redis(config.redis.url!, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            // Reconectar apenas em erros específicos
            return true;
          }
          return false;
        },
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            console.error('❌ Max Redis reconnection attempts reached');
            return null;
          }
          // Aumentar delay progressivamente
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Event handlers
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

    } catch (error) {
      console.error('❌ Failed to create Redis client:', error);
      this.client = null;
    }
  }

  /**
   * Verificar se Redis está disponível
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get com fallback
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Set com TTL opcional
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Delete key
   */
  async del(key: string | string[]): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      const keys = Array.isArray(key) ? key : [key];
      return await this.client!.del(...keys);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return 0;
    }
  }

  /**
   * Clear keys by pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client!.del(keys);
    } catch (error) {
      console.error('Redis clear pattern error:', error);
      return 0;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.hget(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string> | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.hgetall(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return null;
    }
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return false;
    }
  }

  /**
   * Get from sorted set with scores
   */
  async zrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    if (!this.isAvailable()) return [];
    
    try {
      if (withScores) {
        return await this.client!.zrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client!.zrange(key, start, stop);
    } catch (error) {
      console.error('Redis ZRANGE error:', error);
      return [];
    }
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.publish(channel, message);
      return true;
    } catch (error) {
      console.error('Redis PUBLISH error:', error);
      return false;
    }
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Exportar instância singleton
export const redis = new RedisClient();

// Cache service com fallback para memória
class CacheService {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  
  /**
   * Get com parsing automático de JSON
   */
  async get<T>(key: string): Promise<T | null> {
    // Tentar Redis primeiro
    const redisValue = await redis.get(key);
    if (redisValue) {
      try {
        return JSON.parse(redisValue);
      } catch {
        return redisValue as T;
      }
    }
    
    // Fallback para memória
    const memValue = this.memoryCache.get(key);
    if (memValue && memValue.expires > Date.now()) {
      return memValue.value;
    }
    
    // Limpar se expirado
    if (memValue) {
      this.memoryCache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Set com serialização automática
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Salvar no Redis
    await redis.set(key, serialized, ttlSeconds);
    
    // Salvar na memória como fallback
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
    
    // Limpar cache de memória antigo
    this.cleanupMemoryCache();
  }
  
  /**
   * Invalidar cache
   */
  async invalidate(pattern: string): Promise<void> {
    // Limpar Redis
    await redis.clearPattern(pattern);
    
    // Limpar memória
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern.replace('*', ''))) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }
  
  /**
   * Cache com função de atualização
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlSeconds = 3600
  ): Promise<T> {
    // Tentar pegar do cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Buscar novo valor
    const value = await fetcher();
    
    // Salvar no cache
    await this.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Delete keys from cache
   */
  async del(keys: string | string[]): Promise<number> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    // Delete from Redis
    const redisDeleted = await redis.del(keys);
    
    // Delete from memory cache
    keysArray.forEach(key => this.memoryCache.delete(key));
    
    return redisDeleted;
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    // Clear from Redis
    const redisDeleted = await redis.clearPattern(pattern);
    
    // Clear from memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(pattern.replace('*', ''))) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    return redisDeleted;
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    return await redis.zadd(key, score, member);
  }
  
  /**
   * Limpar cache de memória expirado
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.memoryCache.forEach((value, key) => {
      if (value.expires < now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    // Limitar tamanho do cache de memória
    if (this.memoryCache.size > 1000) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      
      // Remover 20% dos mais antigos
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }
}

export const cache = new CacheService();

// Cache keys constants
export const CacheKeys = {
  // User
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  
  // Product
  product: (id: string) => `product:${id}`,
  productList: (userId: string, page: number) => `products:${userId}:${page}`,
  productBySku: (sku: string) => `product:sku:${sku}`,
  
  // Validation
  validation: (id: string) => `validation:${id}`,
  validationQueue: () => 'validation:queue',
  
  // Analytics
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  qrScans: (qrCode: string) => `qr:scans:${qrCode}`,
  
  // Reports
  report: (id: string) => `report:${id}`,
  reportList: (productId: string) => `reports:${productId}`,
  
  // Laboratory
  laboratory: (id: string) => `lab:${id}`,
  laboratoryList: () => 'labs:all',
  
  // Session
  session: (token: string) => `session:${token}`,
  
  // Rate limiting
  rateLimit: (identifier: string, endpoint: string) => `rate:${identifier}:${endpoint}`,
} as const;

// TTL constants (em segundos)
export const CacheTTL = {
  short: 300,      // 5 minutos
  medium: 3600,    // 1 hora
  long: 86400,     // 24 horas
  week: 604800,    // 7 dias
} as const;