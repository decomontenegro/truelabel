# 🏷️ True Label - Sistema de Gestão de Produtos e Certificações

## 📋 Visão Geral

True Label é uma plataforma completa para gestão de produtos, validações e certificações, com geração segura de QR codes para rastreabilidade.

## ✅ Status do Projeto

- **Versão Atual**: v1.0.0-stable
- **Status**: ✅ Funcional e Deployado
- **Deploy**: https://truelabel2-11z22qdif-decos-projects-925dd01d.vercel.app
- **Última Atualização**: 25/06/2025

## 🚀 Início Rápido

### Verificar Sistema
```bash
./verify-system.sh
```

### Instalação Local
```bash
# 1. Instale dependências
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# 3. Inicie o sistema
npm run dev
```

### Acesso
- **Frontend**: http://localhost:9103
- **Backend**: http://localhost:3334

## 🏗️ Arquitetura

```
true-label/
├── client/                 # Frontend React + TypeScript
├── server/                 # Backend Node.js + Express
├── docs/                   # Documentação organizada
├── project-cleanup/        # Arquivos antigos (pode ser removido)
├── package.json           # Scripts principais
└── vercel.json            # Configuração de deploy
```

## 🎯 Funcionalidades

### ✅ Implementadas
- 🏷️ **Gestão de Produtos** - CRUD completo
- ✅ **Sistema de Validações** - Aprovação de claims
- 🛡️ **Certificações** - Gestão e estatísticas
- 📱 **QR Codes Seguros** - Apenas produtos aprovados
- 📊 **Dashboard** - Métricas e analytics

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

# Verificação
./verify-system.sh       # Verifica se sistema está OK

# Produção
npm run build           # Build para produção
```

## 📚 Documentação

- **[Mapa de Processos](docs/development/MAPA-DE-PROCESSOS-TRUELABEL.md)** - Como foi desenvolvido
- **[Versão Estável](docs/deployment/VERSION-STABLE-v1.0.0.md)** - Documentação da v1.0.0
- **[Deploy](docs/deployment/DEPLOY-SUCESSO-v1.0.0.md)** - Informações de deploy

## 🚀 Deploy

### Status Atual
- ✅ **Frontend**: Deployado no Vercel
- ⚠️ **Backend**: Local (próximo passo para produção)

### URL de Produção
https://truelabel2-11z22qdif-decos-projects-925dd01d.vercel.app

## 🔧 Configuração

### Variáveis de Ambiente Essenciais

#### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:3334
```

#### Backend (server/.env)
```env
PORT=3334
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🧪 Verificação Rápida

```bash
# 1. Verificar sistema
./verify-system.sh

# 2. Testar API
curl http://localhost:3334/health

# 3. Testar frontend
open http://localhost:9103
```

## 📊 Limpeza Realizada

- ✅ **74 documentações antigas** movidas para `project-cleanup/`
- ✅ **8 configurações antigas** organizadas
- ✅ **50 scripts antigos** arquivados
- ✅ **Estrutura limpa** e organizada

## 🎯 Próximos Passos

1. **Deploy do Backend** - Railway/Render
2. **Banco de Dados** - Supabase/PostgreSQL
3. **Limpeza Final** - Remover `project-cleanup/` após confirmação

## 📞 Suporte

- **Issues**: https://github.com/decomontenegro/truelabel/issues
- **Documentação**: `/docs`

---

**Versão Estável Preservada**: Tag `v1.0.0-stable` no GitHub  
**Sistema Verificado**: ✅ Pronto para uso
