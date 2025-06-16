# TRUST LABEL Platform

AI-Powered CPG Validation Platform that connects product claims to accredited laboratory reports through intelligent QR codes.

## 🚀 Quick Start - VERSÃO SIMPLIFICADA

### Instalação Rápida

```bash
cd /Users/andremontenegro/TRUST-LABEL
npm install
```

### Executar o Sistema

```bash
# Servidor completo com todas as funcionalidades
npm start

# Abrir no navegador
open http://localhost:3001/trust-label-interactive.html
```

### Interfaces Disponíveis

1. **Sistema Interativo**: http://localhost:3001/trust-label-interactive.html
2. **Dashboard**: http://localhost:3001/trust-label-dashboard.html
3. **Relatório Público**: http://localhost:3001/trust-label-public-report.html

### Funcionalidades

- ✅ Cadastro de produtos com upload de imagem
- ✅ Validação com IA simulada
- ✅ Geração de QR Code
- ✅ Relatórios detalhados
- ✅ Dashboard administrativo

### Login de Teste

- Email: `admin@trustlabel.com`
- Senha: `admin123`

## 📁 Project Structure

```
trust-label/
├── packages/
│   ├── web/          # Next.js 14 frontend
│   ├── api/          # NestJS backend
│   ├── shared/       # Shared types and utilities
│   └── mobile/       # React Native app (future)
├── infrastructure/
│   ├── docker/       # Docker configurations
│   └── kubernetes/   # K8s manifests (production)
├── prisma/           # Database schema
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run docker:dev` - Start Docker services

## 🏗️ Architecture

### Frontend (Web Package)
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + Radix UI
- **State**: TanStack Query
- **Auth**: NextAuth.js

### Backend (API Package)
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Queue**: Bull
- **Storage**: MinIO/S3

### AI Services
- **LLM**: OpenAI GPT-4
- **Vector DB**: PostgreSQL with pgvector
- **ML Pipeline**: Python services

## 🔐 Security

- JWT authentication
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## 📝 API Documentation

Once the API is running, visit:
- Swagger UI: http://localhost:3001/api/docs

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Deployment

### Development
```bash
npm run deploy:preview
```

### Production
```bash
npm run deploy:prod
```

## 📊 Monitoring

- **Logs**: Elasticsearch + Kibana
- **Metrics**: Prometheus + Grafana
- **APM**: Sentry
- **Analytics**: Google Analytics + Mixpanel

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love by the TRUST LABEL team
- Powered by cutting-edge AI technology
- Committed to transparency in CPG industry

---

For more information, visit [trust-label.com](https://trust-label.com)