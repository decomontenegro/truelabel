# 🚀 Configuração Redis para True Label

## Opção 1: Upstash (Recomendado - Grátis)

### 1. Criar Conta no Upstash
1. Acesse [upstash.com](https://upstash.com)
2. Clique em "Start Free"
3. Faça login com GitHub/Google

### 2. Criar Database Redis
1. Clique em "Create Database"
2. Configure:
   - **Name**: `true-label-production`
   - **Region**: Escolha a mais próxima
   - **Type**: Regional (não Global)
   - **Eviction**: Enable (para free tier)
3. Clique em "Create"

### 3. Obter Credenciais
1. No dashboard do database, copie:
   - **Endpoint**: `xxx.upstash.io`
   - **Port**: `6379`
   - **Password**: `xxxxxxxxxxxxx`

2. Ou use a **REST URL** (mais simples):
   ```
   https://xxx.upstash.io
   ```

### 4. Configurar no True Label
```env
# Redis Configuration
REDIS_ENABLED=true
REDIS_PROVIDER=upstash

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx

# OU configuração tradicional
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxxxxxxxxxx
REDIS_TLS=true
```

## Opção 2: Redis Cloud (Alternativa)

### 1. Criar Conta
1. Acesse [redis.com/try-free](https://redis.com/try-free)
2. Registre-se (30MB grátis)

### 2. Criar Database
1. Escolha "Redis Cloud"
2. Configure:
   - **Cloud**: AWS
   - **Region**: Mais próxima
   - **Free tier**: 30MB

### 3. Configurar
```env
REDIS_ENABLED=true
REDIS_PROVIDER=redis
REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=sua-senha-aqui
REDIS_TLS=true
```

## Opção 3: Local (Desenvolvimento)

### Docker
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Configurar
```env
REDIS_ENABLED=true
REDIS_PROVIDER=local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
```

## 🧪 Testar Conexão

### 1. Script de Teste
Crie `server/scripts/test-redis.ts`:
```typescript
import { redis } from '../src/lib/redis';

async function testRedis() {
  try {
    console.log('🔄 Testando conexão Redis...');
    
    // Test set
    await redis.set('test:key', 'Hello Redis!');
    console.log('✅ SET funcionando');
    
    // Test get
    const value = await redis.get('test:key');
    console.log('✅ GET funcionando:', value);
    
    // Test delete
    await redis.del('test:key');
    console.log('✅ DEL funcionando');
    
    // Test info
    const info = await redis.ping();
    console.log('✅ PING:', info);
    
    console.log('\n🎉 Redis configurado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

testRedis();
```

### 2. Executar Teste
```bash
cd server
npx ts-node scripts/test-redis.ts
```

## 🔧 O que o Redis faz no True Label

### 1. Cache de Consultas
```typescript
// Produtos validados (5 min)
cache.set(`product:${id}`, productData, 300);

// QR Code lookups (1 hora)
cache.set(`qr:${code}`, productId, 3600);

// Contadores de scan (24 horas)
cache.set(`scan:count:${productId}`, count, 86400);
```

### 2. Rate Limiting
```typescript
// API rate limiting
// Max 100 requests/min por IP
await rateLimiter.consume(ip);
```

### 3. Session Storage
```typescript
// Sessões de usuário
// Mais rápido que database
session.store = new RedisStore({ client });
```

### 4. Queue Management
```typescript
// Fila de emails
// Fila de validações
// Jobs assíncronos
queue.add('send-email', emailData);
```

## 📊 Dados Armazenados

### Cache Keys
```
product:123          # Dados do produto
qr:ABC123           # QR → Product ID
user:session:xyz    # Sessão do usuário
rate:limit:ip       # Rate limiting
scan:count:123      # Contador de scans
validation:queue    # Fila de validações
```

### TTL (Time to Live)
```
Produtos: 5 minutos
QR Codes: 1 hora
Sessions: 24 horas
Rate Limit: 1 minuto
Counters: 24 horas
```

## 📈 Monitoramento

### Upstash Dashboard
- Comandos por segundo
- Memória utilizada
- Hit/Miss ratio
- Latência média

### Métricas Importantes
```typescript
// Monitor cache hits
const stats = await redis.info('stats');
console.log('Cache hit rate:', stats.keyspace_hits / stats.keyspace_misses);
```

## ⚠️ Limites Gratuitos

### Upstash Free
- 10,000 comandos/dia
- 256MB storage
- 1 database
- Max 1000 conexões

### Redis Cloud Free
- 30MB storage
- 30 conexões
- Sem SSL customizado

## 🔧 Troubleshooting

### Erro: "Connection refused"
- Verifique host/port
- Confirme que copiou credenciais corretas
- Teste com `redis-cli` se possível

### Erro: "Auth failed"
- Verifique password
- No Upstash, use REST token
- Confirme que TLS está ativado

### Performance lenta
- Use região mais próxima
- Implemente cache local (LRU)
- Reduza tamanho dos dados

## 📝 Boas Práticas

### 1. Use TTL sempre
```typescript
// Sempre defina expiração
await redis.set('key', 'value', 'EX', 300); // 5 min
```

### 2. Prefixos organizados
```typescript
// Use namespaces
'product:123'
'user:session:abc'
'cache:api:endpoint'
```

### 3. Serialização eficiente
```typescript
// Use JSON apenas quando necessário
// Prefira strings simples para IDs
```

## ✅ Checklist

- [ ] Conta criada no Upstash
- [ ] Database Redis criado
- [ ] Credenciais copiadas
- [ ] .env atualizado
- [ ] Teste de conexão bem-sucedido
- [ ] Monitoramento ativo

## 🎯 Próximo Passo

Após configurar o Redis, faça o deploy no Vercel seguindo `SETUP-VERCEL.md`