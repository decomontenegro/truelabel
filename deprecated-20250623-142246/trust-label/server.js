const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database simulado (em produção usar PostgreSQL)
const db = {
    products: [],
    validations: [],
    users: [
        {
            id: 1,
            email: 'admin@trustlabel.com',
            password: 'admin123',
            name: 'Administrador',
            role: 'ADMIN'
        }
    ]
};

// Função para gerar QR Code ID
function generateQRCodeId() {
    return 'TL' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Função simulada de análise AI
async function analyzeWithAI(product) {
    // Simulação de análise AI
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const categories = [
        {
            name: 'Perfil Nutricional',
            items: [
                { name: 'Proteínas', value: '8g', status: 'warning', note: 'Dentro do limite de 20%' },
                { name: 'Carboidratos', value: '20g', status: 'warning', note: 'Dentro do limite de 20%' },
                { name: 'Gorduras', value: '5g', status: 'approved', note: null },
                { name: 'Vitaminas', value: 'Conforme', status: 'approved', note: null },
                { name: 'Minerais', value: 'Conforme', status: 'approved', note: null }
            ]
        },
        {
            name: 'Metais Pesados',
            items: [
                { name: 'Chumbo', value: '< 0.01 mg/kg', status: 'approved', note: null },
                { name: 'Cádmio', value: '< 0.01 mg/kg', status: 'approved', note: null },
                { name: 'Mercúrio', value: '< 0.001 mg/kg', status: 'approved', note: null },
                { name: 'Arsênio', value: '< 0.01 mg/kg', status: 'approved', note: null }
            ]
        },
        {
            name: 'Certificações',
            items: [
                { name: 'ISO 22000', status: 'approved' },
                { name: 'HACCP', status: 'approved' },
                { name: 'GMP', status: 'approved' },
                { name: 'Anvisa RDC 27/2010', status: 'approved' },
                { name: 'Kosher', status: 'approved' }
            ]
        }
    ];
    
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const approvedItems = categories.reduce((acc, cat) => 
        acc + cat.items.filter(item => item.status === 'approved').length, 0);
    const warningItems = categories.reduce((acc, cat) => 
        acc + cat.items.filter(item => item.status === 'warning').length, 0);
    const rejectedItems = categories.reduce((acc, cat) => 
        acc + cat.items.filter(item => item.status === 'rejected').length, 0);
    
    return {
        qrCodeId: generateQRCodeId(),
        validatedAt: new Date().toISOString(),
        categories,
        summary: {
            totalItems,
            approvedItems,
            warningItems,
            rejectedItems
        },
        aiAnalysis: {
            confidence: 95,
            anomaliesDetected: 0,
            recommendation: 'Produto de alta qualidade com pequenas variações nutricionais dentro dos limites regulatórios.',
            score: 'A+'
        },
        laboratory: {
            name: 'Eurofins Brasil',
            accreditation: 'ISO/IEC 17025',
            reportNumber: 'LAB-' + Date.now(),
            issuedDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
    };
}

// Rotas da API

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'TRUST LABEL API está funcionando!',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
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

// Listar produtos
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: db.products
    });
});

// Criar produto
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, description, ean, category } = req.body;
        const product = {
            id: db.products.length + 1,
            name,
            description,
            ean,
            category,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
        };
        
        db.products.push(product);
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Validar produto
app.post('/api/products/:id/validate', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = db.products.find(p => p.id === productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }
        
        // Simular processo de validação com IA
        const validation = await analyzeWithAI(product);
        validation.productId = productId;
        validation.id = db.validations.length + 1;
        
        // Atualizar status do produto
        product.status = 'VALIDATED';
        product.qrCodeId = validation.qrCodeId;
        product.validatedAt = validation.validatedAt;
        
        db.validations.push(validation);
        
        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Obter validação por QR Code
app.get('/api/validations/:qrCodeId', (req, res) => {
    const validation = db.validations.find(v => v.qrCodeId === req.params.qrCodeId);
    const product = validation ? db.products.find(p => p.id === validation.productId) : null;
    
    if (validation && product) {
        res.json({
            success: true,
            data: {
                product,
                validation
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Validação não encontrada'
        });
    }
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    const totalProducts = db.products.length;
    const validatedProducts = db.products.filter(p => p.status === 'VALIDATED').length;
    const pendingProducts = db.products.filter(p => p.status === 'PENDING').length;
    
    const recentValidations = db.validations
        .sort((a, b) => new Date(b.validatedAt) - new Date(a.validatedAt))
        .slice(0, 5)
        .map(v => {
            const product = db.products.find(p => p.id === v.productId);
            return {
                ...v,
                productName: product ? product.name : 'Unknown'
            };
        });
    
    res.json({
        success: true,
        data: {
            totalProducts,
            validatedProducts,
            pendingProducts,
            totalValidations: db.validations.length,
            recentValidations
        }
    });
});

// Servir páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'trust-label-dashboard.html'));
});

app.get('/report/:qrCodeId', (req, res) => {
    res.sendFile(path.join(__dirname, 'trust-label-public-report.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ✅ TRUST LABEL API v2.0 rodando!
    
    🌐 URL: http://localhost:${PORT}
    
    📋 Endpoints disponíveis:
    - GET    /                       - Dashboard
    - GET    /report/:qrCodeId       - Relatório público
    - GET    /api/health             - Status da API
    - POST   /api/auth/login         - Login
    - GET    /api/products           - Listar produtos
    - POST   /api/products           - Criar produto
    - POST   /api/products/:id/validate - Validar produto
    - GET    /api/validations/:qrCodeId - Obter validação
    - GET    /api/dashboard/stats    - Estatísticas
    
    💡 Login de teste:
    - Email: admin@trustlabel.com
    - Senha: admin123
    `);
});