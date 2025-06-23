const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
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

// Simple auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
  
  const token = authHeader.substring(7);
  if (!token || !token.startsWith('mock-jwt-token-')) {
    return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  
  req.user = { id: '1', email: 'admin@truelabel.com', name: 'Admin User' };
  next();
};

// Routes
app.get('/', (req, res) => {
  res.json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api-info',
      'POST /auth/login',
      'GET /auth/verify',
      'GET /products',
      'POST /products',
      'GET /products/:id',
      'PUT /products/:id',
      'DELETE /products/:id'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api-info', (req, res) => {
  res.json({
    success: true,
    name: 'True Label API',
    version: '2.0.0',
    environment: 'production'
  });
});

// Auth routes
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@truelabel.com' && password === 'admin123') {
    const token = `mock-jwt-token-${Date.now()}`;
    res.json({
      success: true,
      token,
      user: {
        id: '1',
        email: 'admin@truelabel.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/auth/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Products routes
app.get('/products', authenticate, (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  let filteredProducts = [...productsStorage];
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = productsStorage.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }
  
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  console.log(`📦 Products API: Returning ${paginatedProducts.length} products (total: ${filteredProducts.length})`);
  
  res.json({
    success: true,
    products: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / parseInt(limit))
    }
  });
});

app.post('/products', authenticate, (req, res) => {
  const { name, brand, category, description, claims, sku } = req.body;
  
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
  
  res.json({
    success: true,
    product: newProduct,
    message: 'Produto criado com sucesso'
  });
});

app.get('/products/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const product = productsStorage.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ 
      success: false, 
      message: 'Product not found' 
    });
  }

  console.log(`🔍 Product found: ${product.name} (ID: ${id})`);
  res.json({
    success: true,
    product
  });
});

app.put('/products/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, brand, category, description, claims, sku } = req.body;
  
  const productIndex = productsStorage.findIndex(p => p.id === id);
  
  if (productIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Product not found' 
    });
  }
  
  // Update product
  const updatedProduct = {
    ...productsStorage[productIndex],
    name: name || productsStorage[productIndex].name,
    brand: brand || productsStorage[productIndex].brand,
    category: category || productsStorage[productIndex].category,
    description: description || productsStorage[productIndex].description,
    claims: claims || productsStorage[productIndex].claims,
    sku: sku || productsStorage[productIndex].sku,
    updatedAt: new Date().toISOString()
  };
  
  productsStorage[productIndex] = updatedProduct;
  console.log(`✅ Product updated: ${updatedProduct.name} (ID: ${id})`);
  
  res.json({
    success: true,
    product: updatedProduct,
    message: 'Produto atualizado com sucesso'
  });
});

app.delete('/products/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  const productIndex = productsStorage.findIndex(p => p.id === id);
  
  if (productIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Product not found' 
    });
  }
  
  const deletedProduct = productsStorage.splice(productIndex, 1)[0];
  console.log(`🗑️ Product deleted: ${deletedProduct.name} (ID: ${id})`);
  
  res.json({
    success: true,
    message: `Produto ${deletedProduct.name} removido com sucesso`
  });
});

// Notifications route
app.get('/notifications', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0
  });
});

module.exports = app;
