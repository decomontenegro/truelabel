# 🚀 Deploy True Label - Passo a Passo

## 📋 Pré-requisitos

- [ ] Conta na Vercel (frontend)
- [ ] Conta no Railway/Render (backend)
- [ ] Conta no Supabase/Neon (PostgreSQL)

## Passo 1: Criar Banco PostgreSQL (Supabase)

### 1.1 Criar conta no Supabase
1. Acesse https://supabase.com
2. Crie uma conta gratuita
3. Crie um novo projeto

### 1.2 Configurar banco
1. Anote a DATABASE_URL (Settings > Database)
2. Formato: `postgresql://postgres:[password]@[host]:5432/postgres`

## Passo 2: Preparar Backend

### 2.1 Criar arquivo de produção
```bash
cd server
cp .env.production.example .env.production
```

### 2.2 Editar .env.production
```env
DATABASE_URL="[URL do Supabase]"
JWT_SECRET="[Gerar em: https://generate-secret.vercel.app/32]"
NODE_ENV="production"
FRONTEND_URL="https://[seu-app].vercel.app"
```

### 2.3 Atualizar schema do Prisma
```bash
cd server
# Editar prisma/schema.prisma - mudar provider para "postgresql"
npx prisma generate
npx prisma migrate deploy
```

## Passo 3: Deploy Backend (Railway)

### 3.1 Criar conta no Railway
1. Acesse https://railway.app
2. Conecte com GitHub

### 3.2 Deploy
1. New Project > Deploy from GitHub
2. Selecione o repositório
3. Configure:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`

### 3.3 Variáveis de Ambiente
Adicione todas do .env.production no Railway

### 3.4 Anote a URL
Exemplo: `https://true-label-backend.up.railway.app`

## Passo 4: Deploy Frontend (Vercel)

### 4.1 Preparar frontend
```bash
cd client
# Criar .env.production
echo "VITE_API_BASE_URL=https://[url-do-backend]/api/v1" > .env.production
echo "VITE_QR_BASE_URL=https://[seu-app].vercel.app" >> .env.production
```

### 4.2 Instalar Vercel CLI
```bash
npm i -g vercel
```

### 4.3 Deploy
```bash
cd client
vercel
# Seguir prompts:
# - Root Directory: ./
# - Framework: Vite
# - Build Command: npm run build
# - Output Directory: dist
```

### 4.4 Configurar domínio customizado (opcional)
No dashboard da Vercel

## Passo 5: Configurar CORS no Backend

Atualizar FRONTEND_URL no Railway para a URL da Vercel

## Passo 6: Testar

1. Acesse a URL da Vercel
2. Faça login
3. Teste as funcionalidades

## 📝 Checklist Final

- [ ] Banco PostgreSQL criado e migrado
- [ ] Backend deployado e rodando
- [ ] Frontend deployado na Vercel
- [ ] CORS configurado
- [ ] Sistema testado

## 🔧 Comandos Úteis

### Ver logs do backend
```bash
railway logs
```

### Atualizar backend
```bash
git push
# Railway faz deploy automático
```

### Atualizar frontend
```bash
cd client
vercel --prod
```

## 🚨 Troubleshooting

### Erro de CORS
- Verificar FRONTEND_URL no backend
- Adicionar URL da Vercel no CORS

### Erro de banco
- Verificar DATABASE_URL
- Rodar migrations: `npx prisma migrate deploy`

### Erro 500
- Ver logs do Railway
- Verificar variáveis de ambiente