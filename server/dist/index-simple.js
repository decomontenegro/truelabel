"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 9100;
app.use((0, cors_1.default)({
    origin: ['http://localhost:9101', 'http://localhost:9100', 'http://localhost:5173'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});
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
app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
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
    }
    else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});
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
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor simples rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});
exports.default = app;
//# sourceMappingURL=index-simple.js.map