import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import cacheService, { CacheKeys, CacheTTL, Cacheable, CacheInvalidate } from '../../src/services/cacheService';
import { redis } from '../../src/lib/redis';

describe('Cache Service Integration Tests', () => {
  beforeAll(async () => {
    // Ensure Redis is connected
    if (!redis.isAvailable()) {
      await redis.connect();
    }
  });

  afterAll(async () => {
    // Clean up
    await cacheService.clear();
    await redis.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clear();
    cacheService.resetStats();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const data = { id: 1, name: 'Test Product' };
      const { namespace, identifier } = CacheKeys.product('1');

      await cacheService.set(namespace, identifier, data);
      const retrieved = await cacheService.get(namespace, identifier);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('test', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should respect TTL', async () => {
      const data = 'test data';
      await cacheService.set('test', 'ttl-test', data, { ttl: 1 });

      // Should exist immediately
      let result = await cacheService.get('test', 'ttl-test');
      expect(result).toBe(data);

      // Should not exist after TTL
      await new Promise(resolve => setTimeout(resolve, 1100));
      result = await cacheService.get('test', 'ttl-test');
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      const data = 'test data';
      await cacheService.set('test', 'delete-test', data);
      
      await cacheService.delete('test', 'delete-test');
      const result = await cacheService.get('test', 'delete-test');
      
      expect(result).toBeNull();
    });
  });

  describe('Compression', () => {
    it('should compress large data', async () => {
      const largeData = {
        data: 'x'.repeat(2000), // 2KB of data
        items: Array(100).fill({ id: 1, name: 'item' })
      };

      await cacheService.set('test', 'compressed', largeData, { compress: true });
      const retrieved = await cacheService.get('test', 'compressed');

      expect(retrieved).toEqual(largeData);
    });

    it('should not compress small data', async () => {
      const smallData = { id: 1, name: 'Small' };

      await cacheService.set('test', 'not-compressed', smallData, { compress: true });
      const retrieved = await cacheService.get('test', 'not-compressed');

      expect(retrieved).toEqual(smallData);
    });
  });

  describe('Versioning', () => {
    it('should invalidate cache on version mismatch', async () => {
      const data = { value: 'version 1' };
      
      await cacheService.set('test', 'versioned', data, { version: 1 });
      
      // Should retrieve with correct version
      let result = await cacheService.get('test', 'versioned', 1);
      expect(result).toEqual(data);

      // Should not retrieve with wrong version
      result = await cacheService.get('test', 'versioned', 2);
      expect(result).toBeNull();
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate all entries with a tag', async () => {
      await cacheService.set('test', 'item1', 'data1', { tags: ['products'] });
      await cacheService.set('test', 'item2', 'data2', { tags: ['products'] });
      await cacheService.set('test', 'item3', 'data3', { tags: ['users'] });

      await cacheService.invalidateByTags(['products']);

      expect(await cacheService.get('test', 'item1')).toBeNull();
      expect(await cacheService.get('test', 'item2')).toBeNull();
      expect(await cacheService.get('test', 'item3')).toBe('data3');
    });

    it('should handle multiple tags', async () => {
      await cacheService.set('test', 'multi', 'data', { 
        tags: ['products', 'featured', 'new'] 
      });

      await cacheService.invalidateByTags(['featured']);
      expect(await cacheService.get('test', 'multi')).toBeNull();
    });
  });

  describe('Pattern Operations', () => {
    it('should delete by pattern', async () => {
      await cacheService.set('products', 'item1', 'data1');
      await cacheService.set('products', 'item2', 'data2');
      await cacheService.set('users', 'user1', 'data3');

      await cacheService.deletePattern('*products*');

      expect(await cacheService.get('products', 'item1')).toBeNull();
      expect(await cacheService.get('products', 'item2')).toBeNull();
      expect(await cacheService.get('users', 'user1')).toBe('data3');
    });
  });

  describe('getOrCompute Pattern', () => {
    it('should compute and cache on miss', async () => {
      let computeCount = 0;
      const computeFn = async () => {
        computeCount++;
        return { computed: true, count: computeCount };
      };

      const result1 = await cacheService.getOrCompute(
        'test', 
        'compute', 
        computeFn,
        { ttl: 60 }
      );

      const result2 = await cacheService.getOrCompute(
        'test', 
        'compute', 
        computeFn,
        { ttl: 60 }
      );

      expect(result1).toEqual({ computed: true, count: 1 });
      expect(result2).toEqual({ computed: true, count: 1 });
      expect(computeCount).toBe(1);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values in batch', async () => {
      await cacheService.set('test', 'item1', 'data1');
      await cacheService.set('test', 'item2', 'data2');
      await cacheService.set('test', 'item3', 'data3');

      const keys = [
        { namespace: 'test', identifier: 'item1' },
        { namespace: 'test', identifier: 'item2' },
        { namespace: 'test', identifier: 'item3' },
        { namespace: 'test', identifier: 'nonexistent' }
      ];

      const results = await cacheService.mget<string>(keys);

      expect(results.get('test:item1')).toBe('data1');
      expect(results.get('test:item2')).toBe('data2');
      expect(results.get('test:item3')).toBe('data3');
      expect(results.get('test:nonexistent')).toBeNull();
    });
  });

  describe('Lock Mechanism', () => {
    it('should prevent cache stampede', async () => {
      let computeCount = 0;
      const slowCompute = async () => {
        computeCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return computeCount;
      };

      // Start multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        cacheService.getOrComputeWithLock('test', 'locked', slowCompute)
      );

      const results = await Promise.all(promises);

      // All should get the same result
      expect(results.every(r => r === 1)).toBe(true);
      expect(computeCount).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      await cacheService.set('test', 'stats', 'data');

      // Hit
      await cacheService.get('test', 'stats');
      // Miss
      await cacheService.get('test', 'nonexistent');
      // Hit
      await cacheService.get('test', 'stats');

      const stats = await cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(66.67);
    });
  });

  describe('Cache Query', () => {
    it('should cache query results', async () => {
      let queryCount = 0;
      const mockQuery = async () => {
        queryCount++;
        return [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' }
        ];
      };

      const result1 = await cacheService.cacheQuery(
        'SELECT * FROM products WHERE category = ?',
        mockQuery,
        { ttl: 60 }
      );

      const result2 = await cacheService.cacheQuery(
        'SELECT * FROM products WHERE category = ?',
        mockQuery,
        { ttl: 60 }
      );

      expect(result1).toEqual(result2);
      expect(queryCount).toBe(1);
    });
  });
});

// Test decorators
class TestService {
  private callCount = 0;

  @Cacheable({ ttl: 60, namespace: 'test-service' })
  async getData(id: string) {
    this.callCount++;
    return { id, data: 'test', count: this.callCount };
  }

  @CacheInvalidate(['products'])
  async updateData(id: string, data: any) {
    return { id, ...data };
  }

  getCallCount() {
    return this.callCount;
  }
}

describe('Cache Decorators', () => {
  let service: TestService;

  beforeEach(async () => {
    await cacheService.clear();
    service = new TestService();
  });

  it('should cache method results with @Cacheable', async () => {
    const result1 = await service.getData('123');
    const result2 = await service.getData('123');
    const result3 = await service.getData('456');

    expect(result1).toEqual(result2);
    expect(result1.count).toBe(1);
    expect(result3.count).toBe(2);
    expect(service.getCallCount()).toBe(2);
  });

  it('should invalidate cache with @CacheInvalidate', async () => {
    await cacheService.set('test', 'item1', 'data1', { tags: ['products'] });
    await cacheService.set('test', 'item2', 'data2', { tags: ['products'] });

    await service.updateData('123', { name: 'Updated' });

    expect(await cacheService.get('test', 'item1')).toBeNull();
    expect(await cacheService.get('test', 'item2')).toBeNull();
  });
});