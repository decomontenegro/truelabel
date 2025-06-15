const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9100;

// Middlewares
app.use(cors({
  origin: ['http://localhost:9101', 'http://localhost:9100', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: 'development'
  });
});

// Root API
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'True Label API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/me',
      '/api/v1/products',
      '/api/v1/validations',
      '/api/v1/reports'
    ]
  });
});

// Mock user data
const mockUsers = [
  {
    id: '1',
    email: 'admin@truelabel.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'ADMIN'
  },
  {
    id: '2',
    email: 'marca@exemplo.com',
    password: 'marca123',
    name: 'Marca Exemplo',
    role: 'BRAND'
  },
  {
    id: '3',
    email: 'analista@labexemplo.com',
    password: 'lab123',
    name: 'Lab Exemplo',
    role: 'LABORATORY'
  }
];

// Login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token: 'mock-jwt-token-' + user.id
    });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Get current user
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  // Mock - retorna o primeiro usuário
  const { password, ...userWithoutPassword } = mockUsers[0];
  res.json(userWithoutPassword);
});

// Register
app.post('/api/v1/auth/register', (req, res) => {
  const { email, name, password, role } = req.body;
  
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  res.json({
    user: {
      id: Date.now().toString(),
      email,
      name,
      role: role || 'BRAND'
    },
    token: 'mock-jwt-token-new'
  });
});

// Products
app.get('/api/v1/products', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Produto Orgânico Premium',
      brand: 'Marca Exemplo',
      category: 'Alimentos',
      status: 'ACTIVE',
      sku: 'PRD001',
      description: 'Produto 100% orgânico certificado',
      imageUrl: '/placeholder.jpg',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Suplemento Natural',
      brand: 'Marca Exemplo',
      category: 'Suplementos',
      status: 'ACTIVE',
      sku: 'SUP001',
      description: 'Suplemento natural sem aditivos',
      imageUrl: '/placeholder.jpg',
      createdAt: new Date().toISOString()
    }
  ]);
});

// Single product
app.get('/api/v1/products/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Produto Orgânico Premium',
    brand: 'Marca Exemplo',
    category: 'Alimentos',
    status: 'ACTIVE',
    sku: 'PRD001',
    description: 'Produto 100% orgânico certificado',
    imageUrl: '/placeholder.jpg',
    claims: ['Orgânico', 'Sem Glúten', 'Vegano'],
    nutritionalInfo: {
      calories: '120kcal',
      protein: '3g',
      carbs: '25g',
      fat: '2g'
    },
    createdAt: new Date().toISOString()
  });
});

// Validations
app.get('/api/v1/validations', (req, res) => {
  res.json([
    {
      id: '1',
      productId: '1',
      status: 'APPROVED',
      labName: 'Laboratório ABC',
      validatedAt: new Date().toISOString(),
      results: {
        organic: true,
        glutenFree: true,
        vegan: true
      }
    }
  ]);
});

// Reports
app.get('/api/v1/reports', (req, res) => {
  res.json([
    {
      id: '1',
      productId: '1',
      fileName: 'analise_produto_001.pdf',
      uploadedAt: new Date().toISOString(),
      laboratory: 'Laboratório ABC',
      status: 'VERIFIED'
    }
  ]);
});

// Laboratories
app.get('/api/v1/laboratories', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Laboratório ABC',
      accreditation: 'ISO 17025',
      email: 'contato@lababc.com',
      status: 'ACTIVE'
    }
  ]);
});

// Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.json([]);
});

// Analytics
app.get('/api/v1/analytics/overview', (req, res) => {
  res.json({
    totalProducts: 2,
    activeProducts: 2,
    totalValidations: 1,
    pendingValidations: 0
  });
});

// QR Code
app.get('/api/v1/qr/:code', (req, res) => {
  res.json({
    product: {
      id: '1',
      name: 'Produto Orgânico Premium',
      brand: 'Marca Exemplo',
      validations: [
        {
          status: 'APPROVED',
          labName: 'Laboratório ABC',
          validatedAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Error handling
app.use((req, res) => {
  console.log('404 - Rota não encontrada:', req.method, req.url);
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 True Label Backend (Basic)
==============================
✅ Servidor rodando na porta ${PORT}
📊 Ambiente: development
🔗 Health: http://localhost:${PORT}/health
🔗 API: http://localhost:${PORT}/api/v1

🔑 Credenciais de teste:
- admin@truelabel.com / admin123
- marca@exemplo.com / marca123
- analista@labexemplo.com / lab123
  `);
});