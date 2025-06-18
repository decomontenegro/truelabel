// Test cache service functionality
const { redis } = require('./server/src/lib/redis');

async function testCache() {
  console.log('Testing Cache Service...\n');
  
  try {
    // Test 1: Redis connection
    console.log('1. Testing Redis connection:');
    if (redis.isAvailable()) {
      console.log('✓ Redis is available');
      
      // Test basic operations
      await redis.set('test:key', 'test value', 60);
      const value = await redis.get('test:key');
      console.log(`✓ Set/Get works: ${value}`);
      
      await redis.del('test:key');
      console.log('✓ Delete works');
    } else {
      console.log('✗ Redis is not available');
    }
  } catch (error) {
    console.log('Error testing cache:', error.message);
  }
  
  // Test cache service methods
  try {
    const cacheService = require('./server/src/services/cacheService').default;
    
    console.log('\n2. Testing Cache Service methods:');
    
    // Test set/get
    await cacheService.set('test', 'item1', { data: 'test data' });
    const cached = await cacheService.get('test', 'item1');
    console.log('✓ Cache set/get:', cached);
    
    // Test stats
    const stats = await cacheService.getStats();
    console.log('✓ Cache stats:', stats);
    
    // Cleanup
    await cacheService.delete('test', 'item1');
    console.log('✓ Cache delete works');
    
  } catch (error) {
    console.log('Error with cache service:', error.message);
  }
  
  process.exit(0);
}

testCache();