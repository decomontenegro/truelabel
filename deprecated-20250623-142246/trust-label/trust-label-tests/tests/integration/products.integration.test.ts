import request from 'supertest';
import { app } from '@/server';
import { prisma } from '../setup';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env.config';

describe('Products API Integration Tests', () => {
  let server: any;
  let authToken: string;
  let user: any;
  let brand: any;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Create test user and brand
    user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: 'hashed',
        name: faker.person.fullName(),
        role: 'brand',
      },
    });

    brand = await prisma.brand.create({
      data: {
        name: faker.company.name(),
        email: user.email,
        userId: user.id,
      },
    });

    authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'A test product description',
      ean: '7891234567890',
      category: 'supplement',
      claims: ['High protein', 'Low sugar', 'Gluten free'],
      ingredients: ['Whey protein', 'Natural flavors', 'Stevia'],
      nutritionalInfo: {
        servingSize: '30g',
        calories: 120,
        protein: '25g',
        carbs: '3g',
        fat: '1g',
      },
    };

    it('should create product successfully', async () => {
      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProductData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: validProductData.name,
          description: validProductData.description,
          ean: validProductData.ean,
          category: validProductData.category,
          brandId: brand.id,
          status: 'PENDING',
          claims: validProductData.claims,
          ingredients: validProductData.ingredients,
          nutritionalInfo: validProductData.nutritionalInfo,
        },
      });

      // Verify in database
      const product = await prisma.product.findUnique({
        where: { id: response.body.data.id },
      });
      expect(product).toBeDefined();
      expect(product?.brandId).toBe(brand.id);
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        description: 'Missing required fields',
      };

      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'category' }),
          ]),
        },
      });
    });

    it('should validate EAN format', async () => {
      // Arrange
      const invalidEAN = {
        ...validProductData,
        ean: 'invalid-ean',
      };

      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEAN);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'ean',
          message: expect.stringContaining('Invalid EAN'),
        })
      );
    });

    it('should prevent duplicate EAN', async () => {
      // Arrange
      await prisma.product.create({
        data: {
          ...validProductData,
          brandId: brand.id,
        },
      });

      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProductData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
        },
      });
    });

    it('should handle file upload for product images', async () => {
      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', validProductData.name)
        .field('category', validProductData.category)
        .field('ean', validProductData.ean)
        .attach('images', Buffer.from('fake-image-data'), 'product.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.images).toBeDefined();
      expect(response.body.data.images).toHaveLength(1);
    });

    it('should require authentication', async () => {
      // Act
      const response = await request(server)
        .post('/api/products')
        .send(validProductData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should only allow brand users to create products', async () => {
      // Arrange
      const labUser = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'hashed',
          name: faker.person.fullName(),
          role: 'laboratory',
        },
      });

      const labToken = jwt.sign(
        { id: labUser.id, email: labUser.email, role: labUser.role },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${labToken}`)
        .send(validProductData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
        },
      });
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await prisma.product.createMany({
        data: [
          {
            name: 'Product 1',
            ean: '1111111111111',
            category: 'supplement',
            brandId: brand.id,
            status: 'VALIDATED',
          },
          {
            name: 'Product 2',
            ean: '2222222222222',
            category: 'food',
            brandId: brand.id,
            status: 'VALIDATED',
          },
          {
            name: 'Product 3',
            ean: '3333333333333',
            category: 'supplement',
            brandId: brand.id,
            status: 'PENDING',
          },
        ],
      });
    });

    it('should list products with pagination', async () => {
      // Act
      const response = await request(server)
        .get('/api/products')
        .query({ page: 1, limit: 2 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) }),
        ]),
        pagination: {
          page: 1,
          limit: 2,
          total: expect.any(Number),
          pages: expect.any(Number),
        },
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by category', async () => {
      // Act
      const response = await request(server)
        .get('/api/products')
        .query({ category: 'supplement' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((p: any) => p.category === 'supplement')).toBe(true);
    });

    it('should filter by status', async () => {
      // Act
      const response = await request(server)
        .get('/api/products')
        .query({ status: 'VALIDATED' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((p: any) => p.status === 'VALIDATED')).toBe(true);
    });

    it('should search by name', async () => {
      // Act
      const response = await request(server)
        .get('/api/products')
        .query({ search: 'Product 1' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Product 1');
    });

    it('should sort results', async () => {
      // Act
      const response = await request(server)
        .get('/api/products')
        .query({ sort: 'name:desc' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data[0].name).toBe('Product 3');
      expect(response.body.data[response.body.data.length - 1].name).toBe('Product 1');
    });
  });

  describe('GET /api/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          name: 'Test Product',
          ean: '7891234567890',
          category: 'supplement',
          brandId: brand.id,
          claims: ['High protein'],
          ingredients: ['Whey protein'],
        },
      });
    });

    it('should get product by id', async () => {
      // Act
      const response = await request(server)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          ean: product.ean,
          category: product.category,
          brand: {
            id: brand.id,
            name: brand.name,
          },
          claims: product.claims,
          ingredients: product.ingredients,
        },
      });
    });

    it('should return 404 for non-existent product', async () => {
      // Act
      const response = await request(server)
        .get(`/api/products/${faker.string.uuid()}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });

    it('should include validations if exist', async () => {
      // Arrange
      const laboratory = await prisma.laboratory.create({
        data: {
          name: faker.company.name(),
          email: faker.internet.email(),
          accreditation: 'ISO17025',
        },
      });

      await prisma.validation.create({
        data: {
          productId: product.id,
          laboratoryId: laboratory.id,
          status: 'VALIDATED',
          validatedAt: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // Act
      const response = await request(server)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.validations).toBeDefined();
      expect(response.body.data.validations).toHaveLength(1);
      expect(response.body.data.validations[0]).toMatchObject({
        status: 'VALIDATED',
        laboratory: {
          name: laboratory.name,
        },
      });
    });
  });

  describe('PUT /api/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          name: 'Original Product',
          ean: '7891234567890',
          category: 'supplement',
          brandId: brand.id,
        },
      });
    });

    it('should update product successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Product',
        description: 'New description',
        claims: ['New claim 1', 'New claim 2'],
      };

      // Act
      const response = await request(server)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: product.id,
          name: updateData.name,
          description: updateData.description,
          claims: updateData.claims,
        },
      });
    });

    it('should only allow owner to update product', async () => {
      // Arrange
      const otherUser = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: 'hashed',
          name: faker.person.fullName(),
          role: 'brand',
        },
      });

      const otherBrand = await prisma.brand.create({
        data: {
          name: faker.company.name(),
          email: otherUser.email,
          userId: otherUser.id,
        },
      });

      const otherToken = jwt.sign(
        { id: otherUser.id, email: otherUser.email, role: otherUser.role },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(server)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Unauthorized Update' });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should not update validated products without admin permission', async () => {
      // Arrange
      await prisma.product.update({
        where: { id: product.id },
        data: { status: 'VALIDATED' },
      });

      // Act
      const response = await request(server)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Trying to update validated product' });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
        },
      });
    });
  });

  describe('DELETE /api/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          name: 'Product to Delete',
          ean: '9999999999999',
          category: 'supplement',
          brandId: brand.id,
        },
      });
    });

    it('should delete product successfully', async () => {
      // Act
      const response = await request(server)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Product deleted successfully',
      });

      // Verify deletion
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should not delete product with validations', async () => {
      // Arrange
      const laboratory = await prisma.laboratory.create({
        data: {
          name: faker.company.name(),
          email: faker.internet.email(),
          accreditation: 'ISO17025',
        },
      });

      await prisma.validation.create({
        data: {
          productId: product.id,
          laboratoryId: laboratory.id,
          status: 'VALIDATED',
        },
      });

      // Act
      const response = await request(server)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'RESOURCE_IN_USE',
        },
      });
    });
  });
});