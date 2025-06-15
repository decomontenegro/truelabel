const request = require('supertest');
const express = require('express');

// Mock do app para testes
const app = express();
app.use(express.json());

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API funcionando' });
});

describe('API Tests', () => {
  test('Health check deve retornar status ok', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  test('Rota de teste deve retornar sucesso', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('API funcionando');
  });

  test('Rota inexistente deve retornar 404', async () => {
    await request(app)
      .get('/rota-inexistente')
      .expect(404);
  });
});

module.exports = app;
