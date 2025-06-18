"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    const testUsers = {
        'admin@truelabel.com': { password: 'admin123', role: 'ADMIN', name: 'Admin User' },
        'marca@exemplo.com': { password: 'marca123', role: 'BRAND', name: 'Marca Exemplo' },
        'analista@labexemplo.com': { password: 'lab123', role: 'LABORATORY', name: 'Analista Lab' },
        'validador@truelabel.com': { password: 'validator123', role: 'VALIDATOR', name: 'Validador' }
    };
    const user = testUsers[email];
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
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
        });
    }
});
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('mock-jwt-token')) {
        return res.status(401).json({ message: 'Token inválido' });
    }
    req.user = {
        id: '1',
        email: 'admin@truelabel.com',
        role: 'ADMIN'
    };
    next();
};
app.get('/api/v1/users/me', authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
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
app.get('/api/v1/validations', authenticate, (req, res) => {
    res.json({
        success: true,
        data: [],
        total: 0
    });
});
app.get('/api/v1/notifications', authenticate, (req, res) => {
    res.json({
        success: true,
        data: [],
        total: 0
    });
});
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
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        path: req.originalUrl
    });
});
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API: http://localhost:${PORT}/api/v1`);
    console.log('✅ Backend mínimo funcionando!');
});
exports.default = app;
//# sourceMappingURL=index-minimal.js.map