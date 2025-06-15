const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando!' });
});

// Rotas de autenticação simples
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registro recebido:', req.body);
  res.json({
    success: true,
    message: 'Registro funcionando!',
    data: req.body
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('📝 Login recebido:', req.body);
  res.json({
    success: true,
    message: 'Login funcionando!',
    data: {
      user: { email: req.body.email },
      token: 'fake-token-123'
    }
  });
});

// Iniciar servidor
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Registro: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
});
