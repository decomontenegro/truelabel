# TRUST LABEL - Plataforma Completa de Validação CPG com IA

<p align="center">
  <img src="https://img.shields.io/badge/versão-3.0.0-blue.svg" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg" />
  <img src="https://img.shields.io/badge/typescript-5.3.3-blue.svg" />
  <img src="https://img.shields.io/badge/status-production%20ready-success.svg" />
</p>

## 🚀 Visão Geral

O TRUST LABEL é uma plataforma completa de validação de produtos de consumo (CPG) que utiliza inteligência artificial para garantir transparência, segurança e confiabilidade nas informações de produtos.

### ✨ Características Principais

- **🤖 Validação com IA** - Análise inteligente de produtos usando OpenAI GPT-4
- **🔐 Autenticação Completa** - Sistema de roles (Admin, Brand, Laboratory, Prescriber)
- **🔗 QR Code Rastreável** - Geração e rastreamento de QR codes únicos
- **🧪 Integração com Laboratórios** - API para receber laudos de laboratórios parceiros
- **📄 Relatórios PDF** - Geração automática de relatórios e certificados
- **🇧🇷 Certificações Brasileiras** - Suporte completo para selos nacionais
- **📊 Dashboard Analytics** - Visualização de dados em tempo real
- **🔔 Notificações Real-time** - WebSocket com Socket.io
- **📧 Sistema de Email** - Notificações automáticas via SendGrid
- **☁️ Cloud Ready** - Pronto para deploy em Vercel/AWS

## 🛠 Stack Tecnológica

### Backend
- **Node.js** + **TypeScript** - Runtime e linguagem
- **Express.js** - Framework web
- **Prisma ORM** - ORM moderno e type-safe
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e filas
- **Bull** - Processamento de filas
- **Socket.io** - WebSocket para real-time
- **JWT** - Autenticação
- **OpenAI API** - Inteligência artificial
- **AWS S3** - Armazenamento de arquivos
- **SendGrid** - Envio de emails

### Frontend (HTML de exemplo)
- **Tailwind CSS** - Estilização
- **Chart.js** - Gráficos
- **QRCode.js** - Geração de QR codes

## 📋 Arquitetura

```
trust-label/
├── src/
│   ├── server.ts           # Entry point
│   ├── config/             # Configurações
│   ├── controllers/        # Controllers
│   ├── services/           # Lógica de negócio
│   ├── routes/             # Rotas da API
│   ├── middlewares/        # Middlewares
│   ├── utils/              # Utilitários
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Schema do banco
├── uploads/                # Arquivos enviados
├── logs/                   # Logs da aplicação
└── dist/                   # Build compilado
```

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- Docker (opcional)

### 1. Clone o repositório
```bash
git clone https://github.com/trust-label/trust-label-platform.git
cd trust-label-platform
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Inicie os serviços com Docker
```bash
docker-compose up -d
```

### 5. Configure o banco de dados
```bash
npx prisma generate
npx prisma db push
```

### 6. Inicie o servidor
```bash
npm run dev
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Redefinir senha

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Obter produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/:id/validate` - Validar produto

### Validações
- `GET /api/validations` - Listar validações
- `GET /api/validations/:id` - Obter validação
- `POST /api/validations/:id/report` - Gerar relatório

### QR Codes
- `POST /api/qrcodes/generate` - Gerar QR code
- `GET /api/qrcodes/:code` - Obter informações
- `POST /api/qrcodes/:code/scan` - Registrar scan
- `GET /api/qrcodes/:productId/analytics` - Analytics

### Laboratórios
- `GET /api/laboratories` - Listar laboratórios
- `POST /api/laboratories/register` - Registrar laboratório
- `POST /api/laboratories/upload-report` - Upload de laudo
- `POST /api/laboratories/webhook/:id` - Webhook para resultados

### Dashboard
- `GET /api/dashboard/admin` - Dashboard admin
- `GET /api/dashboard/brand` - Dashboard marca
- `GET /api/dashboard/laboratory` - Dashboard laboratório
- `GET /api/dashboard/analytics` - Analytics avançado

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/trustlabel"

# API Keys
OPENAI_API_KEY="sk-..."
SENDGRID_API_KEY="SG..."

# JWT
JWT_SECRET="your-super-secret"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="trust-label-uploads"

# Redis
REDIS_URL="redis://localhost:6379"
```

## 💡 Exemplos de Uso

### Criar e Validar um Produto

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'brand@example.com',
    password: 'senha123'
  })
});

const { accessToken } = await loginResponse.json();

// 2. Criar produto
const productResponse = await fetch('http://localhost:3001/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    name: 'Whey Protein Premium',
    category: 'suplemento',
    barcode: '7891234567890',
    claims: [
      { type: 'NUTRITIONAL', value: '25g de proteína por dose' },
      { type: 'CERTIFICATION', value: 'Livre de glúten' }
    ]
  })
});

const product = await productResponse.json();

// 3. Validar produto
const validationResponse = await fetch(
  `http://localhost:3001/api/products/${product.id}/validate`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);
```

## 📊 Monitoramento e Logs

### Logs
Os logs são salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs

### Monitoramento de Filas
Acesse o Bull Dashboard em desenvolvimento:
```bash
npm run queue:monitor
```

### Métricas
- Total de produtos validados
- Taxa de aprovação/reprovação
- Tempo médio de processamento
- QR codes escaneados por região

## 🚀 Deploy

### Vercel
```bash
# Build
npm run build

# Deploy
vercel --prod
```

### Docker
```bash
# Build imagem
docker build -t trust-label .

# Run container
docker run -p 3001:3001 --env-file .env trust-label
```

### AWS EC2/ECS
Veja o guia completo em `docs/deployment-aws.md`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 📧 Contato

- Email: contato@trustlabel.com
- Website: [trustlabel.com](https://trustlabel.com)
- LinkedIn: [TRUST LABEL](https://linkedin.com/company/trust-label)

## 🌟 Agradecimentos

- OpenAI pela API de IA
- Vercel pelo hosting
- Toda a comunidade open source

---

<p align="center">
  Feito com ❤️ pela equipe TRUST LABEL
</p>