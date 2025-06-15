import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';

describe('Products Endpoints', () => {
  let authToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'product-test@example.com',
        password: 'hashed-password',
        name: 'Product Test User',
        role: 'BRAND'
      }
    });

    userId = user.id;
    authToken = jwt.sign({ userId: user.id }, config.jwt.secret);
  });

  afterAll(async () => {
    // Limpar dados
    await prisma.product.deleteMany({
      where: { userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'Test Product',
        brand: 'Test Brand',
        category: 'Food',
        description: 'Test description',
        sku: 'TEST-SKU-001',
        batchNumber: 'BATCH-001',
        claims: ['Organic', 'Gluten-free'],
        nutritionalInfo: {
          calories: 100,
          protein: 5,
          carbs: 20,
          fat: 2
        }
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.sku).toBe(newProduct.sku);
      expect(response.body.status).toBe('PENDING');
      
      productId = response.body.id;
    });

    it('should not create product without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Unauthorized Product' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        // missing required fields
        description: 'Only description'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not allow duplicate SKU', async () => {
      const product1 = {
        name: 'Product 1',
        brand: 'Brand',
        category: 'Food',
        sku: 'DUPLICATE-SKU'
      };

      // Criar primeiro produto
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(product1)
        .expect(201);

      // Tentar criar com mesmo SKU
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(product1)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/products', () => {
    beforeAll(async () => {
      // Criar alguns produtos para teste
      await prisma.product.createMany({
        data: [
          {
            name: 'Product A',
            brand: 'Brand A',
            category: 'Food',
            sku: 'SKU-A',
            userId,
            status: 'VALIDATED'
          },
          {
            name: 'Product B',
            brand: 'Brand B',
            category: 'Beverage',
            sku: 'SKU-B',
            userId,
            status: 'PENDING'
          },
          {
            name: 'Product C',
            brand: 'Brand A',
            category: 'Food',
            sku: 'SKU-C',
            userId,
            status: 'VALIDATED'
          }
        ]
      });
    });

    it('should list user products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should filter products by status', async () => {
      const response = await request(app)
        .get('/api/products?status=VALIDATED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
      response.body.products.forEach((product: any) => {
        expect(product.status).toBe('VALIDATED');
      });
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Food')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
      response.body.products.forEach((product: any) => {
        expect(product.category).toBe('Food');
      });
    });

    it('should search products', async () => {
      const response = await request(app)
        .get('/api/products?search=Product A')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].name).toContain('Product A');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.products.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('validations');
      expect(response.body).toHaveProperty('reports');
    });

    it('should not get product from another user', async () => {
      // Criar outro usuário
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-user@example.com',
          password: 'hashed',
          name: 'Other User',
          role: 'BRAND'
        }
      });

      const otherToken = jwt.sign({ userId: otherUser.id }, config.jwt.secret);

      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');

      // Limpar
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        claims: ['New claim 1', 'New claim 2']
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.claims).toEqual(updateData.claims);
    });

    it('should not update SKU to existing one', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sku: 'SKU-A' }) // Already exists
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      // Criar produto para deletar
      const productToDelete = await prisma.product.create({
        data: {
          name: 'Product to Delete',
          brand: 'Brand',
          category: 'Food',
          sku: 'DELETE-ME',
          userId
        }
      });

      const response = await request(app)
        .delete(`/api/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verificar que foi deletado
      const deleted = await prisma.product.findUnique({
        where: { id: productToDelete.id }
      });
      expect(deleted).toBeNull();
    });

    it('should not delete product with validations', async () => {
      // Criar produto com validação
      const productWithValidation = await prisma.product.create({
        data: {
          name: 'Product with Validation',
          brand: 'Brand',
          category: 'Food',
          sku: 'WITH-VALIDATION',
          userId
        }
      });

      // Criar validação
      await prisma.validation.create({
        data: {
          productId: productWithValidation.id,
          reportId: 'dummy-report-id',
          userId,
          status: 'APPROVED',
          claimsValidated: {}
        }
      });

      const response = await request(app)
        .delete(`/api/products/${productWithValidation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});