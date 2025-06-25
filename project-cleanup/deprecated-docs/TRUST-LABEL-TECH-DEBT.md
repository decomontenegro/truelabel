# 🔧 TRUST LABEL - Technical Debt & Refactoring Plan

## 📋 Débitos Técnicos Identificados

### 1. **Arquitetura e Organização**

#### Problema Atual:
```typescript
// src/server.ts tem 500+ linhas
// Lógica de negócio misturada com configuração
// Falta de separação de responsabilidades
```

#### Solução Proposta:
```typescript
// Estrutura recomendada
src/
├── application/
│   ├── use-cases/
│   ├── dtos/
│   └── interfaces/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
├── infrastructure/
│   ├── database/
│   ├── http/
│   └── external-services/
└── presentation/
    ├── controllers/
    ├── middlewares/
    └── validators/
```

### 2. **Tratamento de Erros**

#### Problema Atual:
```typescript
// Muitos try-catch genéricos
try {
  // código
} catch (error) {
  next(error); // Sem contexto específico
}
```

#### Solução Proposta:
```typescript
// Sistema de erros tipados
class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`, 400);
    this.name = 'ValidationError';
  }
}

// Error boundary específico
class AIServiceError extends AppError {
  constructor(operation: string, originalError: Error) {
    super(`AI Service failed during ${operation}`, 503);
    this.retryable = true;
    this.originalError = originalError;
  }
}
```

### 3. **Testes Ausentes**

#### Problema Atual:
- 0% de cobertura de testes
- Nenhum teste unitário, integração ou E2E

#### Solução Proposta:
```typescript
// Exemplo de teste unitário
describe('ProductValidationService', () => {
  it('should validate product claims successfully', async () => {
    const mockProduct = createMockProduct();
    const result = await service.validateClaims(mockProduct);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

// Exemplo de teste de integração
describe('POST /api/products', () => {
  it('should create product with valid data', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(validProductData);
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### 4. **Configuração e Variáveis de Ambiente**

#### Problema Atual:
```typescript
// process.env usado diretamente no código
const apiKey = process.env.OPENAI_API_KEY || '';
```

#### Solução Proposta:
```typescript
// Config centralizada com validação
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().optional(),
  // ... outras configs
});

export const config = envSchema.parse(process.env);
```

### 5. **Performance Issues**

#### Problema Atual:
```typescript
// N+1 queries em várias rotas
const products = await prisma.product.findMany();
for (const product of products) {
  const validations = await prisma.validation.findMany({
    where: { productId: product.id }
  });
}
```

#### Solução Proposta:
```typescript
// Usar includes e selects otimizados
const products = await prisma.product.findMany({
  include: {
    validations: {
      where: { status: 'VALIDATED' },
      select: {
        id: true,
        status: true,
        validatedAt: true
      }
    }
  }
});
```

### 6. **Segurança**

#### Problemas Identificados:
- [ ] Falta de rate limiting
- [ ] SQL injection possível em queries raw
- [ ] XSS em inputs não sanitizados
- [ ] Secrets hardcoded em alguns lugares
- [ ] CORS muito permissivo

#### Soluções:
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
};

// CORS restritivo
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 7. **Logging e Monitoring**

#### Problema Atual:
```typescript
console.log('Something happened'); // Sem estrutura
```

#### Solução Proposta:
```typescript
// Winston logger estruturado
import winston from 'winston';

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.json(),
  defaultMeta: { service: 'trust-label-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Uso
logger.info('Product validated', {
  productId: product.id,
  validationId: validation.id,
  duration: Date.now() - startTime,
  userId: req.user.id
});
```

### 8. **Database Migrations**

#### Problema Atual:
- Migrations não versionadas adequadamente
- Falta de rollback strategy
- Dados de seed misturados com schema

#### Solução Proposta:
```typescript
// Migration com up e down
export async function up(db: Prisma) {
  await db.$executeRaw`
    CREATE INDEX CONCURRENTLY idx_products_status 
    ON products(status) 
    WHERE status = 'VALIDATED';
  `;
}

export async function down(db: Prisma) {
  await db.$executeRaw`
    DROP INDEX IF EXISTS idx_products_status;
  `;
}
```

### 9. **API Versioning**

#### Problema Atual:
- Sem versionamento de API
- Breaking changes afetariam todos os clientes

#### Solução Proposta:
```typescript
// Versioning strategy
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Header-based versioning
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});
```

### 10. **Code Duplication**

#### Exemplos de Duplicação:
```typescript
// Validação repetida em múltiplos lugares
if (!product.name || product.name.length < 3) {
  throw new Error('Invalid product name');
}

// Mesma lógica de paginação em várias rotas
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;
```

#### Solução:
```typescript
// Validators centralizados
class ProductValidator {
  static validateName(name: string): void {
    if (!name || name.length < 3) {
      throw new ValidationError('name', 'Must be at least 3 characters');
    }
  }
}

// Pagination helper
export const paginate = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit
  };
};
```

## 📊 Priorização de Refactoring

### P0 - Crítico (Fazer Imediatamente)
1. **Segurança**: Rate limiting, input sanitization
2. **Configuração**: Variáveis de ambiente validadas
3. **Error Handling**: Sistema de erros estruturado

### P1 - Alta Prioridade (Próximas 2 semanas)
1. **Testes**: Setup inicial com casos críticos
2. **Logging**: Sistema de logs estruturado
3. **Performance**: Otimizar queries N+1

### P2 - Média Prioridade (Próximo mês)
1. **Arquitetura**: Refatorar para Clean Architecture
2. **API Versioning**: Implementar v2 mantendo v1
3. **Code Duplication**: Extrair helpers comuns

### P3 - Baixa Prioridade (Futuro)
1. **Microservices**: Separar serviços grandes
2. **Event Sourcing**: Para auditoria completa
3. **GraphQL**: Como alternativa REST

## 🚀 Plano de Ação

### Semana 1-2: Fundação
```bash
# 1. Setup de testes
npm install --save-dev jest @types/jest ts-jest supertest

# 2. Configurar linting estrito
npm install --save-dev @typescript-eslint/eslint-plugin

# 3. Pre-commit hooks
npm install --save-dev husky lint-staged
```

### Semana 3-4: Segurança e Performance
- Implementar rate limiting
- Adicionar input validation
- Otimizar queries do banco
- Setup de monitoring

### Mês 2: Refactoring Arquitetural
- Migrar para Clean Architecture
- Implementar Domain-Driven Design
- Separar camadas adequadamente
- Documentar decisões arquiteturais

## 📈 Métricas de Sucesso

### Code Quality
- [ ] Coverage > 80%
- [ ] 0 vulnerabilidades críticas
- [ ] Complexidade ciclomática < 10
- [ ] Duplicação de código < 5%

### Performance
- [ ] P95 latency < 200ms
- [ ] 0 queries N+1
- [ ] Cache hit rate > 90%
- [ ] Error rate < 0.1%

### Manutenibilidade
- [ ] 100% das funções documentadas
- [ ] Todos os endpoints com OpenAPI
- [ ] README atualizado
- [ ] ADRs para decisões importantes

---

*Este documento deve ser atualizado conforme o débito técnico é resolvido*