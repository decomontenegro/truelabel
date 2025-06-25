# 🚀 True Label - Guia de Deploy no Vercel

## 📋 **Pré-requisitos**

### **1. Conta no Vercel**
- Criar conta em [vercel.com](https://vercel.com)
- Conectar com GitHub

### **2. Repositório GitHub**
- Fazer push do código para GitHub
- Repositório público ou privado

## 🔧 **Configuração do Deploy**

### **1. Estrutura do Projeto**
```
true label/
├── api/
│   ├── index.js          # ✅ API serverless
│   └── package.json      # ✅ Dependências da API
├── client/
│   ├── dist/             # ✅ Build do frontend
│   ├── .env.production   # ✅ Variáveis de produção
│   └── package.json      # ✅ Dependências do frontend
├── vercel.json           # ✅ Configuração do Vercel
└── vercel-build.sh       # ✅ Script de build
```

### **2. Configuração do Vercel**

#### **Framework Settings:**
- **Framework Preset**: Other
- **Build Command**: `./vercel-build.sh`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

#### **Environment Variables:**
```bash
NODE_ENV=production
VITE_API_BASE_URL=/api
VITE_APP_NAME="True Label - CPG Validation Platform"
VITE_NODE_ENV=production
```

## 🚀 **Passos para Deploy**

### **1. Via Vercel CLI (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login no Vercel
vercel login

# Deploy do projeto
cd "/Users/andremontenegro/true label"
vercel

# Seguir as instruções:
# ? Set up and deploy "true label"? [Y/n] Y
# ? Which scope do you want to deploy to? [seu-username]
# ? Link to existing project? [y/N] N
# ? What's your project's name? truelabel
# ? In which directory is your code located? ./
```

### **2. Via GitHub (Automático)**

1. **Push para GitHub:**
```bash
git add .
git commit -m "feat: prepare for vercel deployment"
git push origin main
```

2. **Conectar no Vercel:**
- Acessar [vercel.com/dashboard](https://vercel.com/dashboard)
- Clicar em "New Project"
- Importar repositório do GitHub
- Configurar conforme especificado acima

### **3. Configurações Avançadas**

#### **Build Settings:**
```json
{
  "buildCommand": "./vercel-build.sh",
  "outputDirectory": "client/dist",
  "installCommand": "npm install"
}
```

#### **Environment Variables:**
```bash
NODE_ENV=production
VITE_API_BASE_URL=/api
VITE_QR_BASE_URL=https://[seu-projeto].vercel.app
VITE_APP_NAME="True Label - CPG Validation Platform"
VITE_NODE_ENV=production
VITE_FEATURE_QR_CODES=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_NOTIFICATIONS=true
```

## ✅ **Verificação do Deploy**

### **1. URLs de Teste**
Após o deploy, testar:

```bash
# Frontend
https://[seu-projeto].vercel.app

# API Health Check
https://[seu-projeto].vercel.app/api/health

# API Info
https://[seu-projeto].vercel.app/api/api-info

# Login
curl -X POST https://[seu-projeto].vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@truelabel.com","password":"admin123"}'
```

### **2. Funcionalidades a Testar**
- ✅ **Login** - admin@truelabel.com / admin123
- ✅ **Dashboard** - Carregamento das páginas
- ✅ **Produtos** - Listagem funcionando
- ✅ **Laboratórios** - Sistema completo
- ✅ **Validações** - Funcionalidades básicas
- ✅ **QR Codes** - Geração e validação

## 🔧 **Troubleshooting**

### **Problemas Comuns:**

#### **1. Build Failed**
```bash
# Verificar logs de build
vercel logs [deployment-url]

# Testar build local
./vercel-build.sh
```

#### **2. API não funciona**
- Verificar se `api/index.js` está correto
- Verificar environment variables
- Testar rota `/api/health`

#### **3. Frontend não carrega**
- Verificar se `client/dist` foi gerado
- Verificar `VITE_API_BASE_URL=/api`
- Verificar `vercel.json` rewrites

#### **4. CORS Issues**
- API já configurada com CORS
- Verificar se requests vão para `/api/*`

## 📊 **Monitoramento**

### **1. Logs do Vercel**
```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma função específica
vercel logs /api/index.js
```

### **2. Analytics**
- Acessar Vercel Dashboard
- Ver métricas de performance
- Monitorar erros

## 🎯 **Próximos Passos**

### **1. Domínio Customizado**
- Configurar domínio próprio
- Certificado SSL automático

### **2. Banco de Dados**
- Integrar com Supabase
- Configurar variáveis de ambiente

### **3. Monitoramento**
- Configurar Sentry
- Analytics avançados

## 📋 **Checklist Final**

Antes do deploy, verificar:

- ✅ **Código commitado** no GitHub
- ✅ **vercel.json** configurado
- ✅ **api/index.js** atualizado
- ✅ **client/.env.production** configurado
- ✅ **vercel-build.sh** executável
- ✅ **Dependências** instaladas
- ✅ **Build local** funcionando

## 🎉 **Deploy Realizado!**

Após o deploy bem-sucedido:

1. **URL do projeto**: https://[seu-projeto].vercel.app
2. **API funcionando**: https://[seu-projeto].vercel.app/api/health
3. **Login disponível**: admin@truelabel.com / admin123
4. **Sistema completo**: 33/33 rotas implementadas

---

**🚀 True Label agora está disponível globalmente via Vercel!**
