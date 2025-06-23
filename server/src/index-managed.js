/**
 * True Label API Server - Managed Routes
 * Generated and maintained by API Route Management System
 * 
 * IMPORTANT: This file follows the True Label Route Management Standard
 * - All routes are defined in api-route-registry.json
 * - Changes should be made through the route management system
 * - Use: node api-route-manager.js to manage routes
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3334;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// CORS configuration - Updated for Railway deployment
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://truelabel.vercel.app'
    ];

    // Allow any vercel.app subdomain
    if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.startsWith('mock-jwt-token')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  req.user = { id: '1', email: 'admin@truelabel.com', role: 'ADMIN' };
  next();
};

// ==========================================
// SYSTEM ROUTES
// ==========================================

// Health check - System monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    managedBy: 'API Route Management System',
    features: ['seals', 'product-seals', 'validations']
  });
});

// Route registry info - Development helper
app.get('/api-info', (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');

    // Try multiple possible paths for the registry
    const possiblePaths = [
      path.join(__dirname, '../../api-route-registry.json'),
      path.join(__dirname, '../../../api-route-registry.json'),
      path.join(process.cwd(), 'api-route-registry.json'),
      path.join(process.cwd(), '../api-route-registry.json'),
      '/Users/andremontenegro/true label/api-route-registry.json'
    ];

    let registry = null;
    let registryPath = null;

    for (const registryFile of possiblePaths) {
      if (fs.existsSync(registryFile)) {
        registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
        registryPath = registryFile;
        break;
      }
    }

    if (registry) {
      res.json({
        success: true,
        registry: {
          version: registry.version,
          totalRoutes: registry.metadata.totalRoutes,
          implementedRoutes: registry.metadata.implementedRoutes,
          implementationRate: registry.metadata.implementationRate,
          status: registry.metadata.status,
          lastAudit: registry.metadata.lastAudit
        },
        registryPath,
        availableRoutes: Object.keys(registry.routes).length
      });
    } else {
      res.json({
        success: false,
        message: 'Registry not found',
        searchedPaths: possiblePaths,
        currentWorkingDirectory: process.cwd()
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: 'Error loading registry',
      error: error.message
    });
  }
});

// ==========================================
// AUTH ROUTES
// ==========================================

// POST /auth/login - User authentication
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'password is required' });
    }
    
    // Mock authentication - Support for 3 demo accounts
    const testUsers = {
      'admin@truelabel.com': { password: 'admin123', role: 'ADMIN', name: 'Admin User', id: '1' },
      'marca@exemplo.com': { password: 'marca123', role: 'BRAND', name: 'Marca Exemplo', id: '2' },
      'analista@labexemplo.com': { password: 'lab123', role: 'LABORATORY', name: 'Analista Lab', id: '3' }
    };

    const user = testUsers[email];

    if (user && user.password === password) {
      const response = {
        success: true,
        token: `mock-jwt-token-${Date.now()}`,
        user: {
          id: user.id,
          email,
          name: user.name,
          role: user.role
        }
      };
      res.json(response);
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
  } catch (error) {
    console.error('Error in authLogin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /auth/verify - Verify JWT token
app.get('/auth/verify', authenticate, async (req, res) => {
  try {
    const response = {
      valid: true,
      user: req.user
    };
    res.json(response);
  } catch (error) {
    console.error('Error in authVerify:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /auth/profile - Get user profile
app.get('/auth/profile', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      user: {
        ...req.user,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          avatar: null,
          preferences: {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
          }
        }
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Error in authProfile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// PRODUCTS ROUTES
// ==========================================

// In-memory storage for products (persists during server session)
let productsStorage = [
  {
    id: '1',
    name: 'Produto Exemplo',
    brand: 'Marca Exemplo',
    category: 'Alimentos',
    status: 'VALIDATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// In-memory storage for validations
let validationsStorage = [
  {
    id: '1',
    productId: '1',
    productName: 'Produto Exemplo',
    type: 'NUTRITIONAL_ANALYSIS',
    status: 'VALIDATED',
    requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    validatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000).toISOString(),
    laboratory: 'Lab Exemplo',
    validator: 'Analista Responsável'
  }
];

// In-memory storage for product seals
let productSealsStorage = [];

// GET /products - List all products
app.get('/products', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Use persistent storage instead of static mock data
    let filteredProducts = [...productsStorage];

    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProducts = productsStorage.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const response = {
      success: true,
      products: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / parseInt(limit))
      }
    };

    console.log(`📦 Products API: Returning ${paginatedProducts.length} products (total: ${filteredProducts.length})`);
    res.json(response);
  } catch (error) {
    console.error('Error in productsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /products - Create new product
app.post('/products', authenticate, async (req, res) => {
  try {
    const { name, brand, category, description, claims, sku } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!brand) {
      return res.status(400).json({ success: false, message: 'brand is required' });
    }

    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      brand,
      category: category || 'Categoria Geral',
      description: description || '',
      claims: claims || '',
      sku: sku || `SKU-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validatedAt: null,
      expiresAt: null,
      qrCode: null
    };

    // ✅ SAVE TO PERSISTENT STORAGE
    productsStorage.push(newProduct);
    console.log(`✅ Product created and saved: ${newProduct.name} (ID: ${newProduct.id})`);
    console.log(`📦 Total products in storage: ${productsStorage.length}`);

    const response = {
      success: true,
      product: newProduct,
      message: 'Produto criado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in productsCreate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /products/:id - Get product by ID
app.get('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find product in storage
    const product = productsStorage.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const response = {
      success: true,
      product
    };

    console.log(`🔍 Product found: ${product.name} (ID: ${id})`);
    res.json(response);
  } catch (error) {
    console.error('Error in productsGet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /products/:id - Update product
app.put('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, category, description, claims } = req.body;

    const updatedProduct = {
      id,
      name: name || 'Produto Atualizado',
      brand: brand || 'Marca Atualizada',
      category: category || 'Categoria Atualizada',
      description: description || '',
      claims: claims || '',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = {
      success: true,
      product: updatedProduct,
      message: 'Produto atualizado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in productsUpdate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /products/:id - Delete product
app.delete('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      message: `Produto ${id} removido com sucesso`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in productsDelete:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// NOTIFICATIONS ROUTES
// ==========================================

// GET /notifications - List notifications
app.get('/notifications', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in notificationsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// SEALS ROUTES
// ==========================================

// GET /seals - List available seals
app.get('/seals', authenticate, async (req, res) => {
  try {
    const { isActive } = req.query;

    const mockSeals = [
      {
        id: '1',
        name: 'Orgânico Brasil',
        type: 'ORGANIC',
        isActive: true,
        description: 'Certificação orgânica nacional',
        requirements: ['Certificado orgânico válido', 'Análise de resíduos'],
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Livre de Glúten',
        type: 'GLUTEN_FREE',
        isActive: true,
        description: 'Produto livre de glúten',
        requirements: ['Análise de glúten < 20ppm'],
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Vegano',
        type: 'VEGAN',
        isActive: true,
        description: 'Produto 100% vegano',
        requirements: ['Declaração de ingredientes', 'Auditoria de processo'],
        createdAt: new Date().toISOString()
      }
    ];

    let filteredSeals = mockSeals;
    if (isActive !== undefined) {
      filteredSeals = mockSeals.filter(seal => seal.isActive === (isActive === 'true'));
    }

    console.log(`🏷️ Seals API: Returning ${filteredSeals.length} seals`);
    res.json({
      success: true,
      data: filteredSeals,
      total: filteredSeals.length
    });
  } catch (error) {
    console.error('Error in sealsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// PRODUCT SEALS ROUTES
// ==========================================

// GET /product-seals - Get seals for a product
app.get('/product-seals', authenticate, async (req, res) => {
  try {
    const { productId } = req.query;

    // Mock product seals - empty for new products
    console.log(`🏷️ Product Seals API: Getting seals for product ${productId}`);
    res.json({
      success: true,
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error in productSealsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /product-seals - Add seal to product
app.post('/product-seals', authenticate, async (req, res) => {
  try {
    const { productId, sealId } = req.body;

    const newProductSeal = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      sealId,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      validatedAt: null
    };

    console.log(`🏷️ Product Seal created: ${sealId} for product ${productId}`);
    res.json({
      success: true,
      data: newProductSeal,
      message: 'Selo adicionado ao produto'
    });
  } catch (error) {
    console.error('Error in productSealsCreate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// VALIDATIONS ROUTES
// ==========================================

// GET /validations - List validations
app.get('/validations', authenticate, async (req, res) => {
  try {
    const { productId, status, page = 1, limit = 10 } = req.query;

    // Use persistent storage instead of static mock data
    let filteredValidations = [...validationsStorage];

    // Apply filters
    if (status) {
      filteredValidations = filteredValidations.filter(v => v.status === status);
    }
    if (productId) {
      filteredValidations = filteredValidations.filter(v => v.productId === productId);
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedValidations = filteredValidations.slice(startIndex, endIndex);

    console.log(`✅ Validations API: Returning ${paginatedValidations.length} validations (total: ${filteredValidations.length})`);
    res.json({
      success: true,
      data: paginatedValidations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredValidations.length,
        totalPages: Math.ceil(filteredValidations.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in validationsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /validations - Create new validation request
app.post('/validations', authenticate, async (req, res) => {
  try {
    const { productId, type, claims, nutritionalInfo } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    // Find the product to get its name
    const product = productsStorage.find(p => p.id === productId);
    const productName = product ? product.name : 'Produto Desconhecido';

    const newValidation = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName,
      type: type || 'NUTRITIONAL_ANALYSIS',
      status: 'PENDING',
      claims: claims || [],
      nutritionalInfo: nutritionalInfo || {},
      requestedAt: new Date().toISOString(),
      validatedAt: null,
      expiresAt: null,
      laboratory: null,
      validator: null
    };

    // ✅ SAVE TO PERSISTENT STORAGE
    validationsStorage.push(newValidation);
    console.log(`✅ Validation created and saved: ${newValidation.type} for product ${productName} (ID: ${productId})`);
    console.log(`📋 Total validations in storage: ${validationsStorage.length}`);

    res.json({
      success: true,
      data: newValidation,
      message: 'Solicitação de validação criada com sucesso'
    });
  } catch (error) {
    console.error('Error in validationsCreate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /validations/:id - Update validation status
app.put('/validations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, validatedAt, expiresAt, laboratory, validator } = req.body;

    // Find validation in storage
    const validationIndex = validationsStorage.findIndex(v => v.id === id);
    if (validationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Validation not found'
      });
    }

    const validation = validationsStorage[validationIndex];

    // Update validation
    const updatedValidation = {
      ...validation,
      status: status || 'VALIDATED',
      validatedAt: validatedAt || new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      laboratory: laboratory || 'Lab Exemplo',
      validator: validator || 'Analista Responsável',
      updatedAt: new Date().toISOString()
    };

    // ✅ UPDATE IN STORAGE
    validationsStorage[validationIndex] = updatedValidation;

    // ✅ UPDATE PRODUCT STATUS IF VALIDATION IS APPROVED
    if (status === 'VALIDATED') {
      const productIndex = productsStorage.findIndex(p => p.id === validation.productId);
      if (productIndex !== -1) {
        productsStorage[productIndex].status = 'VALIDATED';
        productsStorage[productIndex].updatedAt = new Date().toISOString();
        console.log(`✅ Product status updated: ${validation.productId} -> VALIDATED`);
      }
    }

    console.log(`✅ Validation updated: ${id} -> ${status}`);

    res.json({
      success: true,
      data: updatedValidation,
      message: 'Validação atualizada com sucesso'
    });
  } catch (error) {
    console.error('Error in validationsUpdate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/queue - Get validation queue
app.get('/validations/queue', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsQueue:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/metrics - Get validation metrics
app.get('/validations/metrics', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      totalValidations: 1,
      automatedPercentage: 85,
      averageProcessingTime: 24,
      accuracyRate: 98.5,
      revalidationRate: 5.2,
      byStatus: { VALIDATED: 1, PENDING: 0, REJECTED: 0 },
      byType: { AUTOMATIC: 1, MANUAL: 0 },
      trendsLast30Days: []
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsMetrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/expiring - Get expiring validations
app.get('/validations/expiring', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsExpiring:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/revalidation-requests - Get revalidation requests
app.get('/validations/revalidation-requests', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsRevalidationRequests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/formula-change-alerts - Get formula change alerts
app.get('/validations/formula-change-alerts', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsFormulaChangeAlerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/lifecycle-metrics - Get lifecycle metrics
app.get('/validations/lifecycle-metrics', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      metrics: {
        activeValidations: 15,
        expiringValidations: 3,
        suspendedQRCodes: 1,
        pendingRevalidations: 2,
        averageValidityPeriod: 365,
        revalidationSuccessRate: 94.5,
        averageRevalidationTime: 7,
        formulaChangeCount: 2
      },
      previousPeriodMetrics: {
        activeValidations: 12,
        expiringValidations: 5,
        suspendedQRCodes: 2,
        pendingRevalidations: 3
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Error in validationsLifecycleMetrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// CERTIFICATIONS ROUTES
// ==========================================

// GET /certifications - List certifications
app.get('/certifications', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in certificationsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /certifications/alerts - Get certification alerts
app.get('/certifications/alerts', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in certificationsAlerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /certifications/statistics - Get certification statistics
app.get('/certifications/statistics', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      total: 0,
      active: 0,
      expiring: 0,
      expired: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in certificationsStatistics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// REPORTS ROUTES
// ==========================================

// GET /reports - List reports
app.get('/reports', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      data: [],
      total: 0
    };
    res.json(response);
  } catch (error) {
    console.error('Error in reportsList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /reports - Create new report
app.post('/reports', authenticate, async (req, res) => {
  try {
    const { title, type, filters, format } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      type: type || 'GENERAL',
      filters: filters || {},
      format: format || 'PDF',
      status: 'GENERATING',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };

    const response = {
      success: true,
      report: newReport,
      message: 'Relatório criado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in reportsCreate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// SUPPORT ROUTES
// ==========================================

// GET /support - Support information
app.get('/support', authenticate, async (req, res) => {
  try {
    const response = {
      success: true,
      support: {
        email: 'suporte@truelabel.com',
        phone: '+55 11 9999-9999',
        hours: 'Segunda a Sexta, 9h às 18h',
        documentation: 'https://docs.truelabel.com',
        status: 'ONLINE'
      },
      faqs: [
        {
          question: 'Como criar um novo produto?',
          answer: 'Acesse a página Produtos e clique em "Novo Produto"'
        },
        {
          question: 'Como gerar um QR Code?',
          answer: 'Na página do produto, clique em "Gerar QR Code"'
        }
      ]
    };
    res.json(response);
  } catch (error) {
    console.error('Error in supportInfo:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// LABORATORIES ROUTES
// ==========================================

// GET /laboratories - List laboratories
app.get('/laboratories', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, active } = req.query;

    // Mock data - em produção viria do banco de dados
    let laboratories = [
      {
        id: '1',
        name: 'Laboratório Central de Análises',
        accreditation: 'ISO/IEC 17025:2017',
        email: 'contato@labcentral.com.br',
        phone: '(11) 3456-7890',
        address: 'Rua das Análises, 123 - São Paulo, SP',
        isActive: true,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-06-10T15:30:00.000Z',
        _count: { reports: 45 }
      },
      {
        id: '2',
        name: 'Instituto de Pesquisas Alimentares',
        accreditation: 'INMETRO RBC',
        email: 'lab@ipa.org.br',
        phone: '(11) 2345-6789',
        address: 'Av. Pesquisa, 456 - Campinas, SP',
        isActive: true,
        createdAt: '2024-02-20T14:00:00.000Z',
        updatedAt: '2024-06-12T09:15:00.000Z',
        _count: { reports: 32 }
      },
      {
        id: '3',
        name: 'LabTech Análises Químicas',
        accreditation: 'ANVISA',
        email: 'info@labtech.com',
        phone: '(21) 9876-5432',
        address: 'Rua Química, 789 - Rio de Janeiro, RJ',
        isActive: false,
        createdAt: '2024-03-10T08:30:00.000Z',
        updatedAt: '2024-05-15T16:45:00.000Z',
        _count: { reports: 18 }
      }
    ];

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      laboratories = laboratories.filter(lab =>
        lab.name.toLowerCase().includes(searchLower) ||
        lab.accreditation.toLowerCase().includes(searchLower) ||
        lab.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por status ativo
    if (active !== undefined) {
      const isActive = active === 'true';
      laboratories = laboratories.filter(lab => lab.isActive === isActive);
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLabs = laboratories.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: paginatedLabs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: laboratories.length,
        totalPages: Math.ceil(laboratories.length / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesList:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /laboratories - Create laboratory
app.post('/laboratories', authenticate, async (req, res) => {
  try {
    const { name, accreditation, email, phone, address } = req.body;

    // Validação básica
    if (!name || !accreditation || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome, acreditação e email são obrigatórios'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const newLaboratory = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      accreditation,
      email,
      phone: phone || '',
      address: address || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { reports: 0 }
    };

    const response = {
      success: true,
      laboratory: newLaboratory,
      message: 'Laboratório criado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesCreate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /laboratories/:id - Get laboratory by ID
app.get('/laboratories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock data - buscar por ID
    const laboratory = {
      id,
      name: 'Laboratório Central de Análises',
      accreditation: 'ISO/IEC 17025:2017',
      email: 'contato@labcentral.com.br',
      phone: '(11) 3456-7890',
      address: 'Rua das Análises, 123 - São Paulo, SP',
      isActive: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-06-10T15:30:00.000Z',
      _count: { reports: 45 },
      description: 'Laboratório especializado em análises físico-químicas e microbiológicas de alimentos.',
      certifications: ['ISO/IEC 17025:2017', 'INMETRO RBC', 'ANVISA'],
      specialties: ['Análises Nutricionais', 'Microbiologia', 'Contaminantes', 'Aditivos']
    };

    const response = {
      success: true,
      laboratory
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesGet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /laboratories/:id - Update laboratory
app.put('/laboratories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accreditation, email, phone, address } = req.body;

    // Validação básica
    if (!name || !accreditation || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome, acreditação e email são obrigatórios'
      });
    }

    const updatedLaboratory = {
      id,
      name,
      accreditation,
      email,
      phone: phone || '',
      address: address || '',
      isActive: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
      _count: { reports: 45 }
    };

    const response = {
      success: true,
      laboratory: updatedLaboratory,
      message: 'Laboratório atualizado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesUpdate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /laboratories/:id - Delete laboratory
app.delete('/laboratories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      message: `Laboratório ${id} removido com sucesso`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesDelete:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /laboratories/:id/stats - Get laboratory statistics
app.get('/laboratories/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const stats = {
      totalReports: 45,
      validatedReports: 42,
      pendingReports: 3,
      rejectedReports: 0,
      verificationRate: 93.3,
      averageProcessingTime: 2.5, // days
      monthlyReports: [
        { month: 'Jan', count: 8 },
        { month: 'Feb', count: 12 },
        { month: 'Mar', count: 15 },
        { month: 'Apr', count: 10 },
        { month: 'May', count: 18 },
        { month: 'Jun', count: 22 }
      ],
      reportsByCategory: [
        { category: 'Nutricionais', count: 20 },
        { category: 'Microbiológicas', count: 15 },
        { category: 'Contaminantes', count: 8 },
        { category: 'Aditivos', count: 2 }
      ]
    };

    const response = {
      success: true,
      stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesStats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /laboratories/:id/reports - Get laboratory reports
app.get('/laboratories/:id/reports', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Mock reports data
    let reports = [
      {
        id: '1',
        title: 'Análise Nutricional - Produto A',
        type: 'NUTRITIONAL',
        status: 'VALIDATED',
        productId: '1',
        productName: 'Produto Exemplo A',
        uploadedAt: '2024-06-10T14:30:00.000Z',
        validatedAt: '2024-06-12T09:15:00.000Z',
        fileUrl: '/reports/lab1_report1.pdf'
      },
      {
        id: '2',
        title: 'Análise Microbiológica - Produto B',
        type: 'MICROBIOLOGICAL',
        status: 'PENDING',
        productId: '2',
        productName: 'Produto Exemplo B',
        uploadedAt: '2024-06-14T16:45:00.000Z',
        validatedAt: null,
        fileUrl: '/reports/lab1_report2.pdf'
      }
    ];

    // Filtrar por status se fornecido
    if (status) {
      reports = reports.filter(report => report.status === status);
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = reports.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: paginatedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reports.length,
        totalPages: Math.ceil(reports.length / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesReports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /laboratories/:id/status - Update laboratory status
app.patch('/laboratories/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive deve ser um valor booleano'
      });
    }

    const updatedLaboratory = {
      id,
      name: 'Laboratório Central de Análises',
      accreditation: 'ISO/IEC 17025:2017',
      email: 'contato@labcentral.com.br',
      phone: '(11) 3456-7890',
      address: 'Rua das Análises, 123 - São Paulo, SP',
      isActive,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
      _count: { reports: 45 }
    };

    const response = {
      success: true,
      laboratory: updatedLaboratory,
      message: `Laboratório ${isActive ? 'ativado' : 'desativado'} com sucesso`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in laboratoriesUpdateStatus:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// QR ROUTES
// ==========================================

// POST /qr/generate - Generate QR code
app.post('/qr/generate', authenticate, async (req, res) => {
  try {
    const { productId, data } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const qrCode = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      code: `QR${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      data: data || {},
      url: `http://localhost:3334/qr/validate/QR${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    const response = {
      success: true,
      qrCode,
      message: 'QR Code gerado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in qrGenerate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /qr/validate/:code - Validate QR code
app.get('/qr/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Mock validation - in real app, check database
    const isValid = code.startsWith('QR');

    if (isValid) {
      const response = {
        success: true,
        valid: true,
        product: {
          id: '1',
          name: 'Produto Validado',
          brand: 'Marca Exemplo',
          status: 'VALIDATED',
          validatedAt: new Date().toISOString()
        },
        message: 'QR Code válido'
      };
      res.json(response);
    } else {
      res.status(404).json({
        success: false,
        valid: false,
        message: 'QR Code inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Error in qrValidate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api-info',
      'POST /auth/login',
      'GET /auth/verify',
      'GET /products',
      'POST /products',
      'GET /products/:id',
      'GET /notifications'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 True Label API Server (Managed) running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/api-info`);
  console.log(`⚙️  Managed by: API Route Management System`);
  console.log('✅ Following True Label Route Management Standard');
});

module.exports = app;
