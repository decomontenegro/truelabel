# Clean Architecture Integration Guide

## Overview

The True Label system has been enhanced with Clean Architecture principles to improve maintainability, testability, and scalability.

## Architecture Layers

### 1. Domain Layer (`/src/domain/`)
- **Entities**: Core business objects (Product, Brand, Validation)
- **Value Objects**: Immutable domain concepts (EAN, ProductName, Claim)
- **Repository Interfaces**: Contracts for data persistence
- **Domain Errors**: Business rule violations
- **Enums**: Domain-specific enumerations

### 2. Application Layer (`/src/application/`)
- **Use Cases**: Business operations (CreateProduct, ValidateProduct)
- **DTOs**: Data Transfer Objects for API communication
- **Mappers**: Transform between domain entities and DTOs
- **Application Errors**: Application-level exceptions

### 3. Infrastructure Layer (`/src/infrastructure/`)
- **Database Repositories**: Prisma implementations of domain repositories
- **External Services**: Email, file storage, AI integrations
- **Factories**: Dependency injection and object creation

### 4. Presentation Layer (`/src/presentation/`)
- **Controllers**: HTTP request handlers using use cases
- **Validators**: Input validation
- **Routes**: API endpoint definitions

## Implementation Examples

### Creating a New Product

```typescript
// Controller receives HTTP request
const productController = new ProductController();

// Controller uses factory to get use case
const createProductUseCase = UseCaseFactory.createProductUseCase();

// Use case orchestrates business logic
const product = await createProductUseCase.execute({
  name: "Product Name",
  ean: "7891234567890",
  category: ProductCategory.SUPPLEMENT,
  brandId: "brand-123",
  claims: ["Organic", "Gluten Free"],
  ingredients: ["Water", "Sugar", "Natural Flavors"]
});
```

### Repository Pattern

```typescript
// Domain defines the contract
interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

// Infrastructure implements with Prisma
class PrismaProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const data = await prisma.product.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }
}
```

## Benefits

1. **Testability**: Each layer can be tested in isolation
2. **Flexibility**: Easy to swap implementations (e.g., change database)
3. **Maintainability**: Clear separation of concerns
4. **Business Logic Protection**: Core logic is framework-agnostic
5. **Scalability**: Structure supports growth

## Migration Strategy

### Phase 1: Core Entities (Completed)
- ✅ Product entity with business rules
- ✅ Brand entity
- ✅ Repository interfaces
- ✅ Basic use cases

### Phase 2: Service Integration (In Progress)
- 🔄 Migrate existing services to use repositories
- 🔄 Create use cases for complex operations
- 🔄 Update controllers to use clean architecture

### Phase 3: Complete Migration
- ⏳ Convert all routes to use controllers
- ⏳ Implement remaining use cases
- ⏳ Add comprehensive testing
- ⏳ Remove old service implementations

## Testing

### Domain Tests
```typescript
describe('Product Entity', () => {
  it('should not allow validation of already validated product', () => {
    const product = Product.create({ ... });
    product.markAsValidated();
    
    expect(() => product.markAsInValidation()).toThrow(DomainError);
  });
});
```

### Use Case Tests
```typescript
describe('CreateProductUseCase', () => {
  it('should create product with valid data', async () => {
    const mockRepo = createMockProductRepository();
    const useCase = new CreateProductUseCase(mockRepo);
    
    const result = await useCase.execute(validProductData);
    
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toBeDefined();
  });
});
```

## Best Practices

1. **Keep domain pure**: No framework dependencies in domain layer
2. **Use factories**: Centralize object creation and dependency injection
3. **Follow dependency rule**: Dependencies point inward
4. **Test each layer**: Unit tests for domain, integration tests for infrastructure
5. **Use DTOs**: Don't expose domain entities directly to API

## Next Steps

1. Complete remaining use cases
2. Migrate all controllers to clean architecture
3. Add comprehensive test coverage
4. Document API changes
5. Update frontend to use new API structure