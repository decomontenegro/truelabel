import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9100;

// Middlewares básicos
app.use(cors({
  origin: ['http://localhost:9101', 'http://localhost:9100', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas da API
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'True Label API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/products',
      '/api/v1/validations',
      '/api/v1/reports'
    ]
  });
});

// Rotas de autenticação básicas
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock de autenticação
  if (email === 'admin@truelabel.com' && password === 'admin123') {
    res.json({
      user: {
        id: '1',
        email: 'admin@truelabel.com',
        name: 'Admin',
        role: 'ADMIN'
      },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Rota de produtos mock
app.get('/api/v1/products', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Produto Teste',
      brand: 'Marca Teste',
      category: 'Alimentos',
      status: 'ACTIVE'
    }
  ]);
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor simples rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});

export default app;