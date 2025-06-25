const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'TRUST LABEL API está funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rota de exemplo para produtos
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                name: 'Whey Protein Premium',
                status: 'VALIDATED',
                validatedAt: '2024-01-15'
            },
            {
                id: 2,
                name: 'BCAA Complex',
                status: 'PENDING',
                validatedAt: null
            }
        ]
    });
});

// Rota de login simulada
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@trustlabel.com' && password === 'admin123') {
        res.json({
            success: true,
            token: 'fake-jwt-token-123',
            user: {
                id: 1,
                name: 'Admin',
                email: email,
                role: 'ADMIN'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ✅ TRUST LABEL API rodando!
    
    🌐 URL: http://localhost:${PORT}
    📋 Endpoints disponíveis:
    - GET  /api/health
    - GET  /api/products
    - POST /api/auth/login
    
    💡 Login de teste:
    - Email: admin@trustlabel.com
    - Senha: admin123
    `);
});