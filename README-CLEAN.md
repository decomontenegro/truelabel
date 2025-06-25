# 🏷️ True Label - Sistema de Gestão de Produtos e Certificações

## 📋 Visão Geral

True Label é uma plataforma completa para gestão de produtos, validações e certificações, com geração segura de QR codes para rastreabilidade.

## ✅ Status do Projeto

- **Versão Atual**: v1.0.0-stable
- **Status**: ✅ Funcional e Deployado
- **Deploy**: https://truelabel2-11z22qdif-decos-projects-925dd01d.vercel.app
- **Última Atualização**: 25/06/2025

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/decomontenegro/truelabel.git
cd truelabel

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# 4. Inicie o sistema
npm run dev
```

### Acesso
- **Frontend**: http://localhost:9103
- **Backend**: http://localhost:3334

## 🏗️ Arquitetura

```
true-label/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas principais
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Definições TypeScript
│   └── package.json
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   └── index-managed.js # Servidor principal
│   └── package.json
├── docs/                   # Documentação
└── package.json           # Scripts principais
```

## 🎯 Funcionalidades

### ✅ Implementadas
- 🏷️ **Gestão de Produtos** - CRUD completo
- ✅ **Sistema de Validações** - Aprovação de claims
- 🛡️ **Certificações** - Gestão e estatísticas
- 📱 **QR Codes Seguros** - Apenas produtos aprovados
- 📊 **Dashboard** - Métricas e analytics
- 📋 **Relatórios** - Exportação de dados

### 🔒 Segurança
- Autenticação JWT
- Validação rigorosa de dados
- CORS configurado
- QR codes apenas para produtos aprovados

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend + backend
npm run client          # Apenas frontend
npm run server          # Apenas backend

# Produção
npm run build           # Build para produção
npm run start           # Inicia em produção

# Utilitários
npm run test            # Executa testes
npm run lint            # Verifica código
```

## 📚 Documentação

- **[Mapa de Processos](docs/development/MAPA-DE-PROCESSOS-TRUELABEL.md)** - Como foi desenvolvido
- **[Versão Estável](docs/deployment/VERSION-STABLE-v1.0.0.md)** - Documentação da v1.0.0
- **[Deploy](docs/deployment/DEPLOY-SUCESSO-v1.0.0.md)** - Informações de deploy

## 🔧 Configuração

### Variáveis de Ambiente

#### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:3334
VITE_APP_NAME=True Label
```

#### Backend (server/.env)
```env
PORT=3334
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🧪 Testes

```bash
# Testar API
curl http://localhost:3334/health

# Testar frontend
open http://localhost:9103
```

## 🚀 Deploy

### Vercel (Frontend)
```bash
vercel --prod
```

### Railway (Backend) - Próximo passo
```bash
railway login
railway deploy
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: https://github.com/decomontenegro/truelabel/issues
- **Documentação**: `/docs`
- **Email**: decomontenegro@me.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🎯 Próximos Passos

1. **Deploy do Backend** - Railway/Render
2. **Banco de Dados** - Supabase/PostgreSQL
3. **Monitoramento** - Logs e métricas
4. **Testes Automatizados** - CI/CD

**Versão Estável Preservada**: Tag `v1.0.0-stable` no GitHub
