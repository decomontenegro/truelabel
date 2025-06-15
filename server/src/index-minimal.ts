import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(helmet());
app.use(compression());

// CORS - Permitir frontend
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'operational',
      database: 'operational'
    }
  });
});

// API base
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'True Label API v1',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      validations: '/api/v1/validations',
      qr: '/api/v1/qr',
      laboratories: '/api/v1/laboratories'
    }
  });
});

// Rotas básicas de autenticação
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Credenciais de teste
  const testUsers = {
    'admin@truelabel.com': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
    'marca@exemplo.com': { password: 'marca123', role: 'BRAND', name: 'Marca Exemplo' },
    'analista@labexemplo.com': { password: 'lab123', role: 'LABORATORY', name: 'Analista Lab' },
    'validador@truelabel.com': { password: 'validator123', role: 'VALIDATOR', name: 'Validador' }
  };
  
  const user = testUsers[email as keyof typeof testUsers];
  
  if (user && user.password === password) {
    const token = `mock-jwt-token-${Date.now()}`;
    res.json({
      success: true,
      token,
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

// Middleware de autenticação simples
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !token.startsWith('mock-jwt-token')) {
    return res.status(401).json({ message: 'Token inválido' });
  }
  
  // Mock user data
  req.user = {
    id: '1',
    email: 'admin@truelabel.com',
    role: 'ADMIN'
  };
  
  next();
};

// Rota para obter dados do usuário
app.get('/api/v1/users/me', authenticate, (req: any, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Rotas de produtos
app.get('/api/v1/products', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Produto Exemplo',
        brand: 'Marca Exemplo',
        sku: 'SKU001',
        status: 'VALIDATED',
        qrCode: 'abc123def456'
      }
    ],
    total: 1
  });
});

// Rotas de laboratórios
app.get('/api/v1/laboratories', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Laboratório Exemplo',
        accreditation: 'ISO 17025',
        status: 'ACTIVE'
      }
    ],
    total: 1
  });
});

// Rotas de validações
app.get('/api/v1/validations', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0
  });
});

// Rotas de notificações
app.get('/api/v1/notifications', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0
  });
});

// Rotas de QR codes
app.get('/api/v1/qr/:code', (req, res) => {
  const { code } = req.params;
  
  res.json({
    success: true,
    data: {
      id: '1',
      code,
      product: {
        name: 'Produto Validado',
        brand: 'Marca Exemplo',
        status: 'VALIDATED'
      },
      validation: {
        status: 'APPROVED',
        date: new Date().toISOString()
      }
    }
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Erro:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api/v1`);
  console.log('✅ Backend mínimo funcionando!');
});

export default app;
