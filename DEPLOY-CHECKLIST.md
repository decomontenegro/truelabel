# ✅ Deploy Checklist - True Label

## 📝 Copie estas informações conforme for criando as contas:

### 1️⃣ Supabase (PostgreSQL)
- [ ] URL do Projeto: _________________________________
- [ ] Database Password: _____________________________
- [ ] Connection String:
```
postgresql://postgres:_______________@db.____________.supabase.co:5432/postgres?sslmode=require
```

### 2️⃣ Upstash (Redis)
- [ ] Database Name: true-label-cache
- [ ] REST URL:
```
https://________________________.upstash.io
```
- [ ] REST TOKEN:
```
________________________________
```

### 3️⃣ SendGrid (Email)
- [ ] Account Email: _________________________________
- [ ] Sender Email: noreply@_________________________
- [ ] API Key:
```
SG._____________________________________________
```

### 4️⃣ JWT Secret (Gere um)
Gere uma senha segura em: https://passwordsgenerator.net/
- [ ] JWT Secret (32+ chars):
```
________________________________
```

---

## 🔧 Variáveis de Ambiente para o Vercel

Copie e cole este bloco inteiro, substituindo os valores:

```env
# Database
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.XXXXX.supabase.co:5432/postgres?sslmode=require

# Auth
JWT_SECRET=SUA_SENHA_SUPER_SEGURA_32_CHARS
JWT_EXPIRES_IN=7d

# Email
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_FROM_EMAIL=noreply@seudominio.com
SENDGRID_FROM_NAME=True Label

# Redis
REDIS_ENABLED=true
REDIS_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=https://XXXXX.upstash.io
UPSTASH_REDIS_REST_TOKEN=XXXXXXXXXXXXXXXXXXXXX

# URLs (atualize com sua URL do Vercel)
NODE_ENV=production
CLIENT_URL=https://truelabel-XXXXX.vercel.app
API_URL=https://truelabel-XXXXX.vercel.app/api
CORS_ORIGIN=https://truelabel-XXXXX.vercel.app

# Frontend (com prefixo VITE_)
VITE_API_BASE_URL=https://truelabel-XXXXX.vercel.app/api/v1
VITE_QR_BASE_URL=https://truelabel-XXXXX.vercel.app
VITE_ENVIRONMENT=production
```

---

## 🚀 Ordem Recomendada

1. **Supabase** (10 min)
   - Criar projeto
   - Copiar connection string
   - Ativar pooling

2. **Upstash** (5 min)
   - Criar database
   - Copiar REST URL e TOKEN

3. **SendGrid** (10 min)
   - Criar conta
   - Verificar sender
   - Gerar API key

4. **Vercel** (5 min)
   - Importar projeto
   - Colar variáveis
   - Deploy!

---

## 🎯 Dicas Importantes

1. **Salve todas as senhas** em um gerenciador de senhas
2. **Teste localmente** com as credenciais antes do deploy
3. **Use senhas fortes** - mínimo 32 caracteres para JWT_SECRET
4. **Verifique SSL** - sempre use `sslmode=require` no PostgreSQL
5. **Sender verification** - verifique o email no SendGrid antes do deploy

---

## 🔍 Verificação Pós-Deploy

- [ ] Site está acessível
- [ ] Login/Registro funcionando
- [ ] Criar produto teste
- [ ] Gerar QR Code
- [ ] Verificar email de boas-vindas
- [ ] Testar scan de QR Code

Boa sorte! 🚀