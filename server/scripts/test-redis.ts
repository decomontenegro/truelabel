import { redis } from '../src/lib/redis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testRedis() {
  console.log('🔄 Testando conexão Redis...');
  console.log(`🔧 Provider: ${process.env.REDIS_PROVIDER || 'não configurado'}`);
  console.log(`📍 Host: ${process.env.REDIS_HOST || process.env.UPSTASH_REDIS_REST_URL || 'não configurado'}`);
  console.log('');

  try {
    // Test basic operations
    console.log('📝 Testando operações básicas...');
    
    // Test SET
    await redis.set('test:key', 'Hello Redis!');
    console.log('✅ SET funcionando');
    
    // Test GET
    const value = await redis.get('test:key');
    console.log('✅ GET funcionando:', value);
    
    // Test SET with expiration
    await redis.setex('test:ttl', 10, 'Expira em 10 segundos');
    const ttl = await redis.ttl('test:ttl');
    console.log('✅ TTL funcionando:', ttl, 'segundos');
    
    // Test counter
    await redis.incr('test:counter');
    const counter = await redis.get('test:counter');
    console.log('✅ INCR funcionando:', counter);
    
    // Test hash operations
    await redis.hset('test:hash', 'field1', 'value1');
    const hashValue = await redis.hget('test:hash', 'field1');
    console.log('✅ HASH funcionando:', hashValue);
    
    // Test list operations
    await redis.lpush('test:list', 'item1', 'item2');
    const listLength = await redis.llen('test:list');
    console.log('✅ LIST funcionando: comprimento =', listLength);
    
    // Clean up
    console.log('\n🧹 Limpando dados de teste...');
    await redis.del('test:key', 'test:ttl', 'test:counter', 'test:hash', 'test:list');
    console.log('✅ Limpeza concluída');
    
    // Test ping
    const pong = await redis.ping();
    console.log('✅ PING:', pong);
    
    // Show memory info if available
    try {
      const info = await redis.info('memory');
      const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1];
      if (memoryUsed) {
        console.log(`📊 Memória usada: ${memoryUsed}`);
      }
    } catch (e) {
      // Info command might not be available in all Redis providers
    }
    
    console.log('\n🎉 Redis configurado com sucesso!');
    console.log('✨ Todas as operações funcionaram perfeitamente!');
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar com Redis:', error.message);
    console.error('\n🔍 Verifique:');
    console.error('   1. As credenciais estão corretas no .env');
    console.error('   2. O Redis está acessível');
    console.error('   3. TLS está configurado corretamente (se aplicável)');
    console.error('   4. Não há bloqueio de firewall');
    console.error('\nDetalhes do erro:', error);
    process.exit(1);
  } finally {
    // Disconnect from Redis
    await redis.quit();
  }
}

// Run the test
testRedis();