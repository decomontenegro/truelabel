# 🚂 True Label - Guia de Deploy no Railway

## 🎯 **Por que Railway?**

Railway é a escolha correta para o True Label porque:
- ✅ **Suporte completo ao Node.js** - Sem limitações de serverless
- ✅ **Arquitetura mantida** - Não precisamos simplificar o código
- ✅ **Express.js nativo** - Funciona exatamente como localmente
- ✅ **Banco de dados integrado** - PostgreSQL incluído
- ✅ **Deploy automático** - Conecta com GitHub
- ✅ **Logs completos** - Debug fácil
- ✅ **Escalabilidade** - Cresce com o projeto

## 🚀 **Passos para Deploy**

### **1. Preparar o Repositório**

```bash
cd "/Users/andremontenegro/true label"

# Commit todas as mudanças
git add .
git commit -m "feat: prepare True Label for Railway deployment with complete architecture"
git push origin main
```

### **2. Criar Conta no Railway**

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Conecte sua conta GitHub

### **3. Criar Novo Projeto**

1. Clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha o repositório `truelabel`
4. Confirme a importação

### **4. Configurar Variáveis de Ambiente**

No painel do Railway, adicione:

```bash
NODE_ENV=production
PORT=$PORT
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://truelabel.vercel.app
```

### **5. Configurar Build e Deploy**

Railway detectará automaticamente:
- **Build Command**: `npm run build:railway`
- **Start Command**: `npm run start:railway`
- **Port**: Automático via `$PORT`

### **6. Deploy Automático**

O Railway fará deploy automaticamente:
1. Instala dependências
2. Copia arquivos necessários
3. Inicia o servidor
4. Configura health checks

## 🔗 **Após o Deploy**

### **1. Obter URL do Railway**

Após o deploy, você receberá uma URL como:
```
https://truelabel-production.up.railway.app
```

### **2. Atualizar Frontend no Vercel**

Adicione variável de ambiente no Vercel:
```bash
VITE_API_BASE_URL=https://truelabel-production.up.railway.app
```

### **3. Atualizar Proxy do Vercel**

Atualize `api/index.js` com a URL do Railway:
```javascript
const RAILWAY_API_URL = 'https://truelabel-production.up.railway.app';
```

## ✅ **Testar o Deploy**

### **1. Health Check**
```bash
curl https://truelabel-production.up.railway.app/health
```

### **2. API Info**
```bash
curl https://truelabel-production.up.railway.app/api-info
```

### **3. Login**
```bash
curl -X POST https://truelabel-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@truelabel.com","password":"admin123"}'
```

### **4. Produtos**
```bash
curl -H "Authorization: Bearer mock-jwt-token-123" \
  https://truelabel-production.up.railway.app/products
```

### **5. Laboratórios**
```bash
curl -H "Authorization: Bearer mock-jwt-token-123" \
  https://truelabel-production.up.railway.app/laboratories
```

## 📊 **Monitoramento**

### **1. Logs do Railway**
- Acesse o painel do Railway
- Vá para "Deployments"
- Clique em "View Logs"

### **2. Métricas**
- CPU Usage
- Memory Usage
- Network Traffic
- Response Times

### **3. Health Checks**
Railway monitora automaticamente `/health`

## 🔧 **Troubleshooting**

### **Problema: Build Failed**
```bash
# Verificar logs no Railway dashboard
# Ou testar localmente:
npm run build:railway
```

### **Problema: App Crashed**
```bash
# Verificar logs de runtime
# Testar localmente:
npm run start:railway
```

### **Problema: CORS Error**
- Verificar se Vercel URL está em CORS_ORIGIN
- Verificar se frontend aponta para Railway URL

## 🎯 **Vantagens da Arquitetura Railway**

### **✅ Mantém Estrutura Completa**
- Todos os 33 endpoints funcionando
- Sistema de laboratórios completo
- Middleware de autenticação
- Validações robustas
- Error handling completo

### **✅ Escalabilidade**
- Banco PostgreSQL integrado
- Redis para cache
- File uploads
- WebSocket support
- Background jobs

### **✅ DevOps Simplificado**
- Deploy automático via GitHub
- Rollback fácil
- Environment variables
- Logs centralizados
- Monitoring integrado

## 🚀 **Próximos Passos**

Após deploy bem-sucedido:

1. **Configurar banco de dados** PostgreSQL
2. **Implementar Redis** para cache
3. **Configurar uploads** de arquivos
4. **Adicionar monitoring** avançado
5. **Configurar CI/CD** pipeline

---

**🎯 Railway mantém nossa arquitetura completa e robusta, seguindo os TRUE_LABEL_DEVELOPMENT_STANDARDS.md**
