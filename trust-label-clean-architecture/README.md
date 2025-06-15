# 🏗️ TRUST LABEL - Clean Architecture Implementation

## 📁 Estrutura de Pastas

```
src/
├── domain/                 # Camada de Domínio (Entidades e Regras de Negócio)
│   ├── entities/          # Entidades do domínio
│   ├── value-objects/     # Objetos de valor
│   ├── repositories/      # Interfaces de repositórios
│   ├── services/          # Serviços de domínio
│   └── errors/            # Erros de domínio
│
├── application/           # Camada de Aplicação (Casos de Uso)
│   ├── use-cases/        # Casos de uso da aplicação
│   ├── dtos/             # Data Transfer Objects
│   ├── interfaces/       # Interfaces para serviços externos
│   └── mappers/          # Mapeadores entre camadas
│
├── infrastructure/        # Camada de Infraestrutura
│   ├── database/         # Implementação do banco de dados
│   │   ├── prisma/       # Configuração do Prisma
│   │   └── repositories/ # Implementação dos repositórios
│   ├── http/             # Configuração HTTP
│   │   ├── express/      # Configuração do Express
│   │   └── middlewares/  # Middlewares
│   ├── external/         # Serviços externos
│   │   ├── ai/          # Integração com IA
│   │   ├── email/       # Serviço de email
│   │   └── storage/     # Armazenamento de arquivos
│   └── config/           # Configurações
│
├── presentation/          # Camada de Apresentação
│   ├── controllers/      # Controllers HTTP
│   ├── validators/       # Validadores de entrada
│   ├── presenters/       # Formatadores de resposta
│   └── routes/           # Definição de rotas
│
└── shared/                # Código compartilhado
    ├── types/            # Tipos TypeScript
    ├── utils/            # Utilitários
    └── constants/        # Constantes
```

## 🎯 Princípios da Clean Architecture

### 1. **Independência de Frameworks**
O código de negócio não depende de frameworks específicos como Express ou Prisma.

### 2. **Testabilidade**
Cada camada pode ser testada independentemente.

### 3. **Independência de UI**
A lógica de negócio não sabe como os dados são apresentados.

### 4. **Independência de Banco de Dados**
As regras de negócio não dependem do tipo de banco usado.

### 5. **Independência de Agentes Externos**
O núcleo da aplicação não depende de serviços externos.

## 🔄 Fluxo de Dependências

```
Presentation → Application → Domain ← Infrastructure
```

- A camada de **Domínio** não tem dependências
- A camada de **Aplicação** depende apenas do Domínio
- As camadas de **Infraestrutura** e **Apresentação** dependem do Domínio e Aplicação

## 📋 Exemplos de Implementação

### Domain Entity
```typescript
// domain/entities/Product.ts
export class Product {
  constructor(
    private readonly id: string,
    private name: string,
    private ean: string,
    private category: ProductCategory,
    private status: ProductStatus
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.length < 3) {
      throw new DomainError('Product name must have at least 3 characters');
    }
    if (!this.isValidEAN(this.ean)) {
      throw new DomainError('Invalid EAN code');
    }
  }

  canBeValidated(): boolean {
    return this.status === ProductStatus.PENDING;
  }

  markAsValidated(): void {
    if (!this.canBeValidated()) {
      throw new DomainError('Product cannot be validated in current status');
    }
    this.status = ProductStatus.VALIDATED;
  }
}
```

### Use Case
```typescript
// application/use-cases/ValidateProduct.ts
export class ValidateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private validationService: IValidationService,
    private notificationService: INotificationService
  ) {}

  async execute(input: ValidateProductInput): Promise<ValidateProductOutput> {
    const product = await this.productRepository.findById(input.productId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.canBeValidated()) {
      throw new BusinessRuleError('Product cannot be validated');
    }

    const validationResult = await this.validationService.validate(product);
    
    product.markAsValidated();
    await this.productRepository.save(product);
    
    await this.notificationService.notifyValidation(product, validationResult);
    
    return ValidateProductOutputMapper.toDTO(product, validationResult);
  }
}
```

### Repository Interface
```typescript
// domain/repositories/IProductRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByEAN(ean: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  findMany(criteria: ProductCriteria): Promise<Product[]>;
}
```

### Repository Implementation
```typescript
// infrastructure/database/repositories/PrismaProductRepository.ts
export class PrismaProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const data = await this.prisma.product.findUnique({
      where: { id }
    });
    
    return data ? ProductMapper.toDomain(data) : null;
  }

  async save(product: Product): Promise<void> {
    const data = ProductMapper.toPersistence(product);
    
    await this.prisma.product.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }
}
```

## 🧪 Testes

### Teste de Domínio
```typescript
describe('Product Entity', () => {
  it('should create a valid product', () => {
    const product = new Product(
      'id-123',
      'Test Product',
      '7891234567890',
      ProductCategory.SUPPLEMENT,
      ProductStatus.PENDING
    );
    
    expect(product.canBeValidated()).toBe(true);
  });

  it('should throw error for invalid name', () => {
    expect(() => {
      new Product('id', 'AB', '7891234567890', ProductCategory.FOOD, ProductStatus.PENDING);
    }).toThrow(DomainError);
  });
});
```

### Teste de Use Case
```typescript
describe('ValidateProduct UseCase', () => {
  it('should validate a product successfully', async () => {
    const mockProduct = createMockProduct({ status: ProductStatus.PENDING });
    
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockValidationService.validate.mockResolvedValue(validationResult);
    
    const result = await validateProductUseCase.execute({
      productId: 'product-123'
    });
    
    expect(result.status).toBe('validated');
    expect(mockProductRepository.save).toHaveBeenCalled();
    expect(mockNotificationService.notifyValidation).toHaveBeenCalled();
  });
});
```

## 🚀 Benefícios

1. **Manutenibilidade**: Código organizado e fácil de entender
2. **Testabilidade**: Cada camada pode ser testada isoladamente
3. **Flexibilidade**: Fácil trocar implementações (ex: trocar Prisma por TypeORM)
4. **Escalabilidade**: Estrutura preparada para crescer
5. **Independência**: Lógica de negócio protegida de mudanças externas

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)