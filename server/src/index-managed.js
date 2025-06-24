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
      'http://localhost:9101',
      'http://localhost:9102',
      'http://localhost:5173',
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
    product: {
      id: '1',
      name: 'Produto Exemplo',
      brand: 'Marca Exemplo',
      sku: 'SKU-001',
      category: 'Alimentos',
      claims: 'Orgânico, Sem Glúten'
    },
    type: 'MANUAL',
    status: 'VALIDATED', // Backend format
    claimsValidated: {
      'Orgânico': { validated: true, notes: 'Certificado válido' },
      'Sem Glúten': { validated: true, notes: 'Análise confirmada' }
    },
    summary: 'Produto validado com sucesso',
    notes: 'Todos os claims foram verificados',
    confidence: 95,
    dataPoints: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    validatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000).toISOString(),
    laboratory: 'Lab Exemplo',
    validator: 'Analista Responsável',
    user: {
      id: '1',
      name: 'Analista Responsável'
    }
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

    // Convert backend status to frontend status for response
    const normalizedProducts = paginatedProducts.map(product => {
      const normalizedProduct = { ...product };

      // Convert VALIDATED back to APPROVED for frontend compatibility
      if (product.status === 'VALIDATED') {
        normalizedProduct.status = 'APPROVED';
      }

      return normalizedProduct;
    });

    const response = {
      success: true,
      products: normalizedProducts,
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

    // Convert backend status to frontend status for response
    const normalizedProduct = { ...product };

    // Convert VALIDATED back to APPROVED for frontend compatibility
    if (product.status === 'VALIDATED') {
      normalizedProduct.status = 'APPROVED';
    }

    const response = {
      success: true,
      product: normalizedProduct
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

// GET /validations/expiring - Get expiring validations (MUST BE BEFORE /validations/:id)
app.get('/validations/expiring', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(days));

    // Filter validations that expire within the specified days
    const expiringValidations = validationsStorage.filter(validation => {
      if (!validation.expiresAt) return false;
      const expireDate = new Date(validation.expiresAt);
      return expireDate <= expirationDate && expireDate > new Date();
    });

    const response = {
      success: true,
      data: expiringValidations.map(validation => ({
        id: validation.id,
        productId: validation.productId,
        productName: validation.productName,
        expiresAt: validation.expiresAt,
        daysUntilExpiration: Math.ceil((new Date(validation.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)),
        status: validation.status,
        laboratory: validation.laboratory
      })),
      count: expiringValidations.length
    };

    console.log(`📅 Found ${expiringValidations.length} validations expiring in ${days} days`);
    res.json(response);

  } catch (error) {
    console.error('Error in getExpiringValidations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/revalidation-requests - Get revalidation requests (MUST BE BEFORE /validations/:id)
app.get('/validations/revalidation-requests', authenticate, async (req, res) => {
  try {
    // Mock revalidation requests - in real app, these would be stored separately
    const revalidationRequests = validationsStorage
      .filter(v => v.status === 'APPROVED')
      .slice(0, 3)
      .map(validation => ({
        id: `revalidation_${validation.id}`,
        originalValidationId: validation.id,
        productId: validation.productId,
        productName: validation.productName,
        requestedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Formula change detected',
        priority: Math.random() > 0.5 ? 'high' : 'medium',
        status: 'pending'
      }));

    const response = {
      success: true,
      data: revalidationRequests,
      count: revalidationRequests.length
    };

    console.log(`🔄 Found ${revalidationRequests.length} revalidation requests`);
    res.json(response);

  } catch (error) {
    console.error('Error in getRevalidationRequests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/formula-change-alerts - Get formula change alerts (MUST BE BEFORE /validations/:id)
app.get('/validations/formula-change-alerts', authenticate, async (req, res) => {
  try {
    // Mock formula change alerts - in real app, these would be detected automatically
    const formulaChangeAlerts = productsStorage
      .filter(p => p.status === 'VALIDATED')
      .slice(0, 2)
      .map(product => ({
        id: `formula_alert_${product.id}`,
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        detectedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        changeType: Math.random() > 0.5 ? 'ingredient_addition' : 'ingredient_removal',
        severity: Math.random() > 0.7 ? 'high' : 'medium',
        description: 'Potential formula change detected in product composition',
        requiresRevalidation: true,
        status: 'pending_review'
      }));

    const response = {
      success: true,
      data: formulaChangeAlerts,
      count: formulaChangeAlerts.length
    };

    console.log(`⚠️ Found ${formulaChangeAlerts.length} formula change alerts`);
    res.json(response);

  } catch (error) {
    console.error('Error in getFormulaChangeAlerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/lifecycle-metrics - Get validation lifecycle metrics (MUST BE BEFORE /validations/:id)
app.get('/validations/lifecycle-metrics', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate metrics
    const totalValidations = validationsStorage.length;
    const recentValidations = validationsStorage.filter(v => new Date(v.createdAt) > thirtyDaysAgo);
    const approvedValidations = validationsStorage.filter(v => v.status === 'APPROVED');
    const pendingValidations = validationsStorage.filter(v => v.status === 'PENDING');
    const rejectedValidations = validationsStorage.filter(v => v.status === 'REJECTED');

    // Calculate average processing time (mock data)
    const avgProcessingTime = 2.5; // days

    // Calculate expiring validations
    const nextThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringValidations = validationsStorage.filter(v => {
      if (!v.expiresAt) return false;
      const expireDate = new Date(v.expiresAt);
      return expireDate <= nextThirtyDays && expireDate > now;
    });

    const metrics = {
      totalValidations,
      recentValidations: recentValidations.length,
      approvedValidations: approvedValidations.length,
      pendingValidations: pendingValidations.length,
      rejectedValidations: rejectedValidations.length,
      approvalRate: totalValidations > 0 ? (approvedValidations.length / totalValidations * 100).toFixed(1) : 0,
      avgProcessingTime,
      expiringValidations: expiringValidations.length,
      monthlyTrend: {
        validationsCreated: recentValidations.length,
        validationsApproved: recentValidations.filter(v => v.status === 'APPROVED').length,
        validationsRejected: recentValidations.filter(v => v.status === 'REJECTED').length
      }
    };

    const response = {
      success: true,
      data: metrics
    };

    console.log(`📊 Lifecycle metrics calculated: ${totalValidations} total validations`);
    res.json(response);

  } catch (error) {
    console.error('Error in getLifecycleMetrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /validations/queue - Get validation queue (MUST BE BEFORE /validations/:id)
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

// GET /validations/metrics - Get validation metrics (MUST BE BEFORE /validations/:id)
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

// GET /validations - List validations
app.get('/validations', authenticate, async (req, res) => {
  try {
    const { productId, status, page = 1, limit = 10 } = req.query;
    
    console.log('🔍 GET /validations called with params:', { productId, status, page, limit });
    console.log('📊 Total validations in storage:', validationsStorage.length);

    // Use persistent storage instead of static mock data
    let filteredValidations = [...validationsStorage];

    // Apply filters - NORMALIZE STATUS FOR COMPATIBILITY
    if (status) {
      // Convert frontend status to backend status for filtering
      let filterStatus = status;
      if (status === 'APPROVED') {
        filterStatus = 'VALIDATED';
      }
      filteredValidations = filteredValidations.filter(v => v.status === filterStatus);
    }
    if (productId) {
      filteredValidations = filteredValidations.filter(v => v.productId === productId);
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedValidations = filteredValidations.slice(startIndex, endIndex);

    // Convert backend status to frontend status for response
    const normalizedValidations = paginatedValidations.map(validation => {
      const normalizedValidation = { ...validation };
      
      // Convert VALIDATED back to APPROVED for frontend compatibility
      if (validation.status === 'VALIDATED') {
        normalizedValidation.status = 'APPROVED';
      }
      
      // Ensure product object exists
      if (!normalizedValidation.product && normalizedValidation.productId) {
        const product = productsStorage.find(p => p.id === normalizedValidation.productId);
        if (product) {
          normalizedValidation.product = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            category: product.category,
            claims: product.claims
          };
        }
      }
      
      // Ensure user object exists
      if (!normalizedValidation.user) {
        normalizedValidation.user = {
          id: '1',
          name: normalizedValidation.validator || 'Sistema'
        };
      }
      
      return normalizedValidation;
    });

    console.log(`✅ Validations API: Returning ${normalizedValidations.length} validations (total: ${filteredValidations.length})`);
    console.log(`   Filter status: ${status} -> ${status === 'APPROVED' ? 'VALIDATED' : status}`);
    console.log('📋 Validation IDs returned:', normalizedValidations.map(v => `${v.id} (${v.status})`).join(', '));
    
    res.json({
      success: true,
      data: normalizedValidations,
      validations: normalizedValidations, // Add both formats for compatibility
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

// GET /validations/:id - Get validation by ID
app.get('/validations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validationsStorage.find(v => v.id === id);
    if (!validation) {
      return res.status(404).json({
        success: false,
        message: 'Validation not found'
      });
    }

    // Normalize validation for frontend
    const normalizedValidation = { ...validation };
    
    // Convert VALIDATED back to APPROVED for frontend compatibility
    if (validation.status === 'VALIDATED') {
      normalizedValidation.status = 'APPROVED';
    }
    
    // Ensure product object exists
    if (!normalizedValidation.product && normalizedValidation.productId) {
      const product = productsStorage.find(p => p.id === normalizedValidation.productId);
      if (product) {
        normalizedValidation.product = {
          id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          category: product.category,
          claims: product.claims
        };
      }
    }
    
    // Ensure user object exists
    if (!normalizedValidation.user) {
      normalizedValidation.user = {
        id: '1',
        name: normalizedValidation.validator || 'Sistema'
      };
    }

    console.log(`✅ Validation found: ${id} (status: ${validation.status} -> ${normalizedValidation.status})`);
    res.json({
      success: true,
      data: normalizedValidation,
      validation: normalizedValidation // Add both formats for compatibility
    });
  } catch (error) {
    console.error('Error in validationsGet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /validations - Create new validation request
app.post('/validations', authenticate, async (req, res) => {
  try {
    const { 
      productId, 
      reportId,
      type, 
      status,
      claimsValidated,
      summary,
      notes,
      confidence,
      dataPoints,
      claims, 
      nutritionalInfo 
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    // Find the product to get complete info
    const product = productsStorage.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if validation already exists for this product
    const existingValidation = validationsStorage.find(v => v.productId === productId);
    if (existingValidation) {
      return res.status(409).json({
        success: false,
        message: 'Validation already exists for this product. Use PUT /validations/:id to update it.',
        existingValidation: {
          id: existingValidation.id,
          status: existingValidation.status,
          createdAt: existingValidation.createdAt
        },
        suggestion: {
          method: 'PUT',
          url: `/validations/${existingValidation.id}`,
          description: 'Update the existing validation instead of creating a new one'
        }
      });
    }

    // Normalize status from frontend to backend format
    let normalizedStatus = status || 'PENDING';
    if (status === 'APPROVED') {
      normalizedStatus = 'VALIDATED';
    }

    const newValidation = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName: product.name,
      // Complete product object for frontend
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        category: product.category,
        claims: product.claims
      },
      reportId: reportId || null,
      type: type || 'MANUAL',
      status: normalizedStatus,
      claimsValidated: claimsValidated || {},
      summary: summary || '',
      notes: notes || '',
      confidence: confidence || null,
      dataPoints: dataPoints || [],
      claims: claims || [],
      nutritionalInfo: nutritionalInfo || {},
      createdAt: new Date().toISOString(),
      requestedAt: new Date().toISOString(),
      validatedAt: normalizedStatus === 'VALIDATED' ? new Date().toISOString() : null,
      expiresAt: normalizedStatus === 'VALIDATED' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      laboratory: null,
      validator: req.user.name || 'Sistema',
      user: {
        id: req.user.id,
        name: req.user.name || 'Admin User'
      }
    };

    // ✅ SAVE TO PERSISTENT STORAGE
    validationsStorage.push(newValidation);
    
    // ✅ UPDATE PRODUCT STATUS IF VALIDATION IS APPROVED
    if (normalizedStatus === 'VALIDATED') {
      const productIndex = productsStorage.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        productsStorage[productIndex].status = 'VALIDATED';
        productsStorage[productIndex].validatedAt = new Date().toISOString();
        productsStorage[productIndex].updatedAt = new Date().toISOString();
        console.log(`✅ Product status updated on creation: ${productId} -> VALIDATED`);
      }
    }
    
    console.log(`✅ Validation created and saved: ${newValidation.type} for product ${product.name} (ID: ${productId})`);
    console.log(`📋 Total validations in storage: ${validationsStorage.length}`);

    // Convert status back to frontend format before sending response
    const responseValidation = { ...newValidation };
    if (responseValidation.status === 'VALIDATED') {
      responseValidation.status = 'APPROVED';
    }
    
    res.json({
      success: true,
      data: responseValidation,
      validation: responseValidation, // Add both formats for compatibility
      message: 'Validação criada com sucesso'
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

    // ✅ NORMALIZE STATUS: Convert frontend status to backend status
    let normalizedStatus = status;
    if (status === 'APPROVED') {
      normalizedStatus = 'VALIDATED';
    } else if (status === 'REJECTED') {
      normalizedStatus = 'REJECTED';
    }

    // Update validation
    const updatedValidation = {
      ...validation,
      status: normalizedStatus || 'VALIDATED',
      validatedAt: validatedAt || new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      laboratory: laboratory || 'Lab Exemplo',
      validator: validator || 'Analista Responsável',
      updatedAt: new Date().toISOString()
    };

    // ✅ UPDATE IN STORAGE
    validationsStorage[validationIndex] = updatedValidation;

    // ✅ UPDATE PRODUCT STATUS IF VALIDATION IS APPROVED
    if (normalizedStatus === 'VALIDATED') {
      const productIndex = productsStorage.findIndex(p => p.id === validation.productId);
      if (productIndex !== -1) {
        productsStorage[productIndex].status = 'VALIDATED';
        productsStorage[productIndex].updatedAt = new Date().toISOString();
        console.log(`✅ Product status updated: ${validation.productId} -> VALIDATED`);
      }
    } else if (normalizedStatus === 'REJECTED') {
      const productIndex = productsStorage.findIndex(p => p.id === validation.productId);
      if (productIndex !== -1) {
        productsStorage[productIndex].status = 'REJECTED';
        productsStorage[productIndex].updatedAt = new Date().toISOString();
        console.log(`✅ Product status updated: ${validation.productId} -> REJECTED`);
      }
    }

    console.log(`✅ Validation updated: ${id} -> ${normalizedStatus} (original: ${status})`);

    // Convert status back to frontend format before sending response
    const responseValidation = { ...updatedValidation };
    if (responseValidation.status === 'VALIDATED') {
      responseValidation.status = 'APPROVED';
    }
    
    res.json({
      success: true,
      data: responseValidation,
      validation: responseValidation, // ✅ Add both formats for compatibility
      message: 'Validação atualizada com sucesso'
    });
  } catch (error) {
    console.error('Error in validationsUpdate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /validations/:id - Delete validation
app.delete('/validations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find validation
    const validationIndex = validationsStorage.findIndex(v => v.id === id);

    if (validationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Validation not found'
      });
    }

    const validation = validationsStorage[validationIndex];

    // Remove validation
    validationsStorage.splice(validationIndex, 1);

    console.log(`🗑️ Validation deleted: ${validation.productName} (ID: ${id})`);
    console.log(`📋 Total validations in storage: ${validationsStorage.length}`);

    res.json({
      success: true,
      message: 'Validation deleted successfully',
      data: validation
    });

  } catch (error) {
    console.error('Error in deleteValidation:', error);
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
// TRACEABILITY ROUTES
// ==========================================

// GET /traceability/products/:id/events - Get product events
app.get('/traceability/products/:id/events', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: [
        {
          id: '1',
          type: 'HARVEST',
          title: 'Colheita dos Ingredientes',
          description: 'Colheita realizada na fazenda orgânica',
          timestamp: '2025-06-15T06:00:00.000Z',
          location: 'Fazenda Vale Verde - MG',
          temperature: 22,
          humidity: 65,
          coordinates: { lat: -19.9167, lng: -43.9345 },
          metadata: {
            batchId: 'BATCH001',
            quantity: '500 kg'
          }
        },
        {
          id: '2',
          type: 'PROCESSING',
          title: 'Processamento Industrial',
          description: 'Processamento e transformação dos ingredientes',
          timestamp: '2025-06-20T08:00:00.000Z',
          location: 'Fábrica Principal - São Paulo, SP',
          temperature: 18,
          humidity: 45,
          coordinates: { lat: -23.5505, lng: -46.6333 },
          metadata: {
            batchId: 'BATCH001',
            quantity: '1000 unidades'
          }
        },
        {
          id: '3',
          type: 'PACKAGING',
          title: 'Embalagem e Rotulagem',
          description: 'Embalagem final e aplicação de rótulos',
          timestamp: '2025-06-21T14:30:00.000Z',
          location: 'Centro de Embalagem - SP',
          temperature: 20,
          humidity: 50,
          coordinates: { lat: -23.5505, lng: -46.6333 },
          metadata: {
            testResults: 'Aprovado',
            certificate: 'QC-2025-001'
          }
        },
        {
          id: '4',
          type: 'SHIPPING',
          title: 'Expedição para Distribuição',
          description: 'Produto enviado para centros de distribuição',
          timestamp: '2025-06-22T10:00:00.000Z',
          location: 'Centro de Distribuição - SP',
          temperature: 15,
          humidity: 40,
          coordinates: { lat: -23.5505, lng: -46.6333 },
          metadata: {
            trackingNumber: 'TRK-2025-001',
            destination: 'Rede de Varejo'
          }
        }
      ],
      total: 4
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilityEvents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /traceability/products/:id/suppliers - Get product suppliers
app.get('/traceability/products/:id/suppliers', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: [
        {
          id: '1',
          name: 'Fornecedor Premium Ltda',
          type: 'INGREDIENT',
          location: 'Minas Gerais, Brasil',
          certifications: ['Orgânico', 'Fair Trade'],
          contact: 'contato@fornecedorpremium.com.br',
          suppliedItems: ['Ingrediente Principal', 'Aditivos Naturais']
        }
      ],
      total: 1
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilitySuppliers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /traceability/products/:id/origins - Get product origins
app.get('/traceability/products/:id/origins', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: {
        primaryOrigin: {
          country: 'Brasil',
          region: 'Minas Gerais',
          farm: 'Fazenda Orgânica Vale Verde',
          coordinates: { lat: -19.9167, lng: -43.9345 }
        },
        ingredients: [
          {
            name: 'Ingrediente Principal',
            origin: 'Minas Gerais, Brasil',
            percentage: 85,
            certifications: ['Orgânico']
          },
          {
            name: 'Aditivos Naturais',
            origin: 'São Paulo, Brasil',
            percentage: 15,
            certifications: ['Natural']
          }
        ]
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilityOrigins:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /traceability/products/:id/batches - Get product batches
app.get('/traceability/products/:id/batches', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: [
        {
          id: 'BATCH001',
          productionDate: '2025-06-20T08:00:00.000Z',
          expiryDate: '2026-06-20T08:00:00.000Z',
          quantity: 1000,
          status: 'ACTIVE',
          location: 'Estoque Principal',
          qualityScore: 98.5
        }
      ],
      total: 1
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilityBatches:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /traceability/products/:id/route - Get product route
app.get('/traceability/products/:id/route', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: {
        steps: [
          {
            id: '1',
            type: 'ORIGIN',
            location: 'Fazenda Vale Verde - MG',
            timestamp: '2025-06-15T06:00:00.000Z',
            description: 'Colheita dos ingredientes'
          },
          {
            id: '2',
            type: 'PROCESSING',
            location: 'Fábrica Principal - SP',
            timestamp: '2025-06-20T08:00:00.000Z',
            description: 'Processamento e embalagem'
          },
          {
            id: '3',
            type: 'DISTRIBUTION',
            location: 'Centro de Distribuição - SP',
            timestamp: '2025-06-22T10:00:00.000Z',
            description: 'Preparação para distribuição'
          }
        ],
        totalDistance: 450,
        estimatedDelivery: '2025-06-25T18:00:00.000Z'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilityRoute:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /traceability/products/:id/summary - Get traceability summary
app.get('/traceability/products/:id/summary', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const response = {
      success: true,
      data: {
        totalEvents: 4,
        uniqueLocations: 3,
        totalDistance: 450,
        averageTemperature: 18.75,
        complianceScore: 95,
        keyMilestones: [
          {
            id: '1',
            type: 'HARVEST',
            title: 'Colheita dos Ingredientes',
            description: 'Colheita realizada na fazenda orgânica',
            timestamp: '2025-06-15T06:00:00.000Z',
            location: 'Fazenda Vale Verde - MG'
          },
          {
            id: '2',
            type: 'PROCESSING',
            title: 'Processamento Industrial',
            description: 'Processamento e transformação dos ingredientes',
            timestamp: '2025-06-20T08:00:00.000Z',
            location: 'Fábrica Principal - São Paulo, SP'
          },
          {
            id: '4',
            type: 'SHIPPING',
            title: 'Expedição para Distribuição',
            description: 'Produto enviado para centros de distribuição',
            timestamp: '2025-06-22T10:00:00.000Z',
            location: 'Centro de Distribuição - SP'
          }
        ]
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in traceabilitySummary:', error);
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
// DEBUG ROUTES (Development only)
// ==========================================

app.get('/debug/validations', authenticate, async (req, res) => {
  try {
    console.log('🐛 Debug: Validations storage content');
    res.json({
      success: true,
      totalValidations: validationsStorage.length,
      validations: validationsStorage.map(v => ({
        id: v.id,
        productId: v.productId,
        productName: v.productName,
        status: v.status,
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// In-memory storage for QR code analytics
let qrAnalytics = [];

// POST /qr/generate - Generate QR code
app.post('/qr/generate', authenticate, async (req, res) => {
  try {
    const { productId, data } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    // Find the product in storage
    const productIndex = productsStorage.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = productsStorage[productIndex];

    // Check if product already has a QR code
    if (product.qrCode) {
      console.log(`⚠️  QR Code already exists for product ${product.name}: ${product.qrCode}`);

      // Return existing QR code data
      const validationUrl = `${req.protocol}://${req.get('host')}/validation/${product.qrCode}`;
      const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`;

      return res.json({
        success: true,
        qrCode: product.qrCode,
        validationUrl,
        qrCodeImage,
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          sku: product.sku
        },
        message: 'QR Code já existe para este produto'
      });
    }

    // Generate new QR code
    const qrCodeString = `QR${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
    const validationUrl = `${req.protocol}://${req.get('host')}/validation/${qrCodeString}`;
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`;

    // Update product with QR code
    productsStorage[productIndex].qrCode = qrCodeString;
    productsStorage[productIndex].updatedAt = new Date().toISOString();

    console.log(`✅ QR Code generated and saved for product ${product.name}: ${qrCodeString}`);

    const response = {
      success: true,
      qrCode: qrCodeString,
      validationUrl,
      qrCodeImage,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku
      },
      message: 'QR Code gerado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in qrGenerate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /qr/validate/:code - Validate QR code (PUBLIC ROUTE)
app.get('/qr/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    console.log(`🔍 QR Code validation request: ${code}`);

    // Buscar produto pelo QR code
    const product = productsStorage.find(p => p.qrCode === code);

    if (!product) {
      console.log(`❌ QR Code not found: ${code}`);
      return res.status(404).json({
        success: false,
        message: 'QR Code não encontrado ou inválido'
      });
    }

    // Buscar validação do produto
    const validation = validationsStorage.find(v => v.productId === product.id && v.status === 'APPROVED');

    const response = {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        category: product.category,
        status: product.status,
        validatedAt: product.validatedAt,
        expiresAt: product.expiresAt,
        claims: product.claims,
        description: product.description
      },
      validation: validation ? {
        id: validation.id,
        status: validation.status,
        validatedAt: validation.validatedAt,
        laboratory: validation.laboratory,
        validator: validation.validator,
        confidence: validation.confidence
      } : null,
      qrCode: code,
      scannedAt: new Date().toISOString()
    };

    // Registrar acesso para analytics
    const accessRecord = {
      id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      qrCode: code,
      productId: product.id,
      productName: product.name,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      referer: req.headers.referer || null
    };
    qrAnalytics.push(accessRecord);

    console.log(`✅ QR Code validation successful for product: ${product.name}`);
    console.log(`📊 Analytics recorded: ${accessRecord.id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in qrValidate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /qr/analytics/:productId - Get QR code analytics
app.get('/qr/analytics/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    // Filtrar analytics por produto
    const productAnalytics = qrAnalytics.filter(a => a.productId === productId);

    // Calcular estatísticas
    const totalScans = productAnalytics.length;
    const uniqueIPs = new Set(productAnalytics.map(a => a.ip)).size;
    const lastScan = productAnalytics.length > 0 ?
      Math.max(...productAnalytics.map(a => new Date(a.timestamp).getTime())) : null;

    // Agrupar por data
    const scansByDate = productAnalytics.reduce((acc, scan) => {
      const date = new Date(scan.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Agrupar por hora (últimas 24h)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentScans = productAnalytics.filter(a => new Date(a.timestamp) > last24h);

    const scansByHour = recentScans.reduce((acc, scan) => {
      const hour = new Date(scan.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const response = {
      success: true,
      analytics: {
        totalScans,
        uniqueIPs,
        lastScan: lastScan ? new Date(lastScan).toISOString() : null,
        scansByDate,
        scansByHour,
        recentScans: recentScans.slice(-10).map(scan => ({
          timestamp: scan.timestamp,
          userAgent: scan.userAgent,
          ip: scan.ip.replace(/\d+$/, 'xxx') // Mascarar último octeto do IP
        }))
      }
    };

    console.log(`📊 Analytics requested for product ${productId}: ${totalScans} total scans`);
    res.json(response);

  } catch (error) {
    console.error('Error in qrAnalytics:', error);
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
      'GET /notifications',
      'GET /validations',
      'GET /validations/:id',
      'POST /validations',
      'PUT /validations/:id',
      'DELETE /validations/:id',
      'GET /validations/expiring',
      'GET /validations/revalidation-requests',
      'GET /validations/formula-change-alerts',
      'GET /validations/lifecycle-metrics',
      'POST /qr/generate',
      'GET /qr/validate/:code',
      'GET /qr/analytics/:productId',
      'GET /traceability/products/:id/events',
      'GET /traceability/products/:id/suppliers',
      'GET /traceability/products/:id/origins',
      'GET /traceability/products/:id/batches',
      'GET /traceability/products/:id/route',
      'GET /traceability/products/:id/summary'
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
