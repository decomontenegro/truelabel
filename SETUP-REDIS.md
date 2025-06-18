# 🔴 Configuração Redis para True Label

## Por que Redis?

O Redis melhora MUITO a performance do True Label:
- ⚡ Cache de consultas frequentes
- 🔄 Fila de processamento assíncrono
- 📊 Contadores em tempo real
- 🔒 Rate limiting
- 💾 Sessões de usuário

## Opção 1: Upstash (Recomendado - Serverless)

### 1. Criar Conta
1. Acesse [upstash.com](https://upstash.com)
2. Sign up com GitHub/Google

### 2. Criar Database Redis
1. Clique em "Create Database"
2. Configure:
   - **Name**: `true-label-cache`
   - **Region**: Escolha a mais próxima
   - **Type**: Regional (não Global)
   - **Eviction**: Enable (para auto-limpar cache)

### 3. Obter Credenciais
No dashboard, copie:
- **Endpoint**: `xxx.upstash.io`
- **Password**: `xxxxx`
- **Port**: `6379` (padrão)

### 4. Configurar no True Label
```env
REDIS_ENABLED=true
REDIS_URL=redis://default:password@xxx.upstash.io:6379
```

## Opção 2: Redis Cloud (Alternativa)

### 1. Criar Conta
1. Acesse [redis.com](https://redis.com/try-free/)
2. Escolha "Redis Cloud"

### 2. Criar Database
1. Escolha o plano gratuito (30MB)
2. Selecione região mais próxima
3. Nome: `true-label`

### 3. Configurar
```env
REDIS_ENABLED=true
REDIS_URL=redis://default:password@redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com:16379
```

## Opção 3: Local (Desenvolvimento)

### macOS
```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

### Docker
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Configurar
```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

## 🧪 Testar Conexão

### 1. Criar arquivo de teste:
```javascript
// test-redis.js
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis(process.env.REDIS_URL);
  
  try {
    // Testar SET
    await redis.set('test:key', 'Hello Redis!');
    console.log('✅ SET funcionou');
    
    // Testar GET
    const value = await redis.get('test:key');
    console.log('✅ GET funcionou:', value);
    
    // Testar TTL
    await redis.setex('test:ttl', 10, 'Expira em 10s');
    const ttl = await redis.ttl('test:ttl');
    console.log('✅ TTL funcionou:', ttl, 'segundos');
    
    // Limpar
    await redis.del('test:key', 'test:ttl');
    console.log('✅ Limpeza concluída');
    
    redis.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRedis();
```

### 2. Executar teste:
```bash
cd server
node test-redis.js
```

## 📊 O que é cacheado?

O True Label usa Redis para cachear:

### 1. Produtos (5 minutos)
- Detalhes do produto
- Lista de produtos
- QR codes

### 2. Validações (1 hora)
- Status de validação
- Relatórios processados
- Trust scores

### 3. Analytics (5 minutos)
- Métricas em tempo real
- Contadores de acesso
- Dashboard stats

### 4. Sessões (7 dias)
- Tokens de autenticação
- Dados temporários do usuário

## ⚙️ Configurações Avançadas

### Limites de memória
```env
# Máximo de memória para cache (MB)
REDIS_MAX_MEMORY=100

# Política quando atinge limite
REDIS_EVICTION_POLICY=allkeys-lru
```

### Configuração de filas
```env
# Bull Queue settings
REDIS_QUEUE_PREFIX=truelabel:queue
REDIS_QUEUE_DEFAULT_TIMEOUT=30000
```

## 🔍 Monitoramento

### Upstash Dashboard
- Uso de memória
- Comandos por segundo
- Hit rate do cache

### Redis CLI
```bash
# Conectar
redis-cli -u $REDIS_URL

# Comandos úteis
INFO memory
DBSIZE
MONITOR
```

### Logs do True Label
```bash
# Ver cache hits/misses
grep "Cache" server/logs/app.log | grep -E "hit|miss"

# Ver performance
grep "Cache" server/logs/app.log | grep "ms"
```

## 🚨 Limites Gratuitos

### Upstash Free
- 10.000 comandos/dia
- 256MB de armazenamento
- Persistência incluída

### Redis Cloud Free
- 30MB RAM
- 1 database
- 30 conexões

## ⚠️ Boas Práticas

1. **Use TTL** em todas as chaves
2. **Namespace as chaves**: `truelabel:user:123`
3. **Monitore uso de memória**
4. **Implemente fallback** se Redis falhar
5. **Não cache dados sensíveis**

## ✅ Checklist

- [ ] Conta criada no provedor
- [ ] Database Redis criado
- [ ] URL de conexão obtida
- [ ] Variável REDIS_URL configurada
- [ ] Teste de conexão bem-sucedido
- [ ] Cache funcionando na aplicação

## 🎯 Próximo Passo

Com PostgreSQL, Email e Redis configurados, está pronto para fazer o deploy! Siga `DEPLOY-VERCEL.md`