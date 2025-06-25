# 🚀 Deploy True Label no Vercel

## Pré-requisitos ✅

Antes de começar, certifique-se que você tem:
- [ ] PostgreSQL configurado (Supabase/Neon)
- [ ] Redis configurado (Upstash)
- [ ] Email configurado (SendGrid)
- [ ] Conta no GitHub com o código

## 1. Preparar o Projeto

### 1.1 Estrutura de Arquivos
Certifique-se que tem estes arquivos na raiz:
```
true-label/
├── vercel.json          # Configuração do Vercel
├── package.json         # Scripts de build
├── client/             # Frontend React
├── server/             # Backend Express
└── .gitignore          # Ignorar node_modules, .env
```

### 1.2 Atualizar vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index.ts",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "15mb"
      }
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 1.3 Scripts de Build
No `package.json` raiz:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "vercel-build": "npm run build"
  }
}
```

## 2. Criar Conta no Vercel

### 2.1 Cadastro
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Sign Up"
3. Escolha "Continue with GitHub"
4. Autorize o Vercel

### 2.2 Instalar Vercel CLI (Opcional)
```bash
npm i -g vercel
```

## 3. Deploy via Dashboard

### 3.1 Importar Projeto
1. No dashboard Vercel, clique em "Add New Project"
2. Selecione "Import Git Repository"
3. Escolha seu repositório `true-label`
4. Clique em "Import"

### 3.2 Configurar Build
1. **Framework Preset**: Other
2. **Root Directory**: `./`
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `client/dist`
5. **Install Command**: `npm install`

### 3.3 Variáveis de Ambiente
Clique em "Environment Variables" e adicione:

#### Database
```
DATABASE_URL=postgresql://...
```

#### Auth
```
JWT_SECRET=seu-secret-super-seguro-min-32-chars
JWT_EXPIRES_IN=7d
```

#### Email
```
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@seudominio.com
SENDGRID_FROM_NAME=True Label
```

#### Redis
```
REDIS_ENABLED=true
REDIS_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx
```

#### App
```
NODE_ENV=production
CLIENT_URL=https://seu-app.vercel.app
API_URL=https://seu-app.vercel.app/api
CORS_ORIGIN=https://seu-app.vercel.app
```

### 3.4 Deploy
1. Clique em "Deploy"
2. Aguarde o build (5-10 minutos)
3. Vercel criará uma URL como: `true-label-xxx.vercel.app`

## 4. Deploy via CLI

### 4.1 Login
```bash
vercel login
```

### 4.2 Deploy
```bash
# Na raiz do projeto
vercel

# Seguir os prompts:
# - Link to existing project? No
# - What's your project name? true-label
# - Which directory? ./
# - Want to override settings? No
```

### 4.3 Configurar Variáveis
```bash
# Adicionar cada variável
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... etc
```

### 4.4 Deploy Produção
```bash
vercel --prod
```

## 5. Configurar Domínio Customizado

### 5.1 Adicionar Domínio
1. No dashboard do projeto
2. Vá em "Settings" → "Domains"
3. Adicione seu domínio: `app.seudominio.com`

### 5.2 Configurar DNS
Adicione no seu provedor DNS:
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

Ou para domínio raiz:
```
Type: A
Name: @
Value: 76.76.21.21
```

## 6. Pós-Deploy

### 6.1 Testar Aplicação
1. Acesse: `https://seu-app.vercel.app`
2. Teste login
3. Crie um produto teste
4. Gere QR code
5. Teste scan

### 6.2 Verificar Logs
```bash
vercel logs
```

Ou no dashboard: Project → Functions → View Logs

### 6.3 Monitoramento
- **Analytics**: Automático no Vercel
- **Errors**: Integração com Sentry (opcional)
- **Performance**: Web Vitals incluído

## 7. CI/CD Automático

### 7.1 GitHub Integration
Commits na branch `main` fazem deploy automático!

### 7.2 Preview Deployments
PRs criam preview URLs automáticas

### 7.3 Rollback
No dashboard: Deployments → Three dots → Rollback

## 🚨 Troubleshooting

### Build Failing
```bash
# Ver logs detalhados
vercel logs --debug
```

### "Module not found"
- Verificar `package.json` dependencies
- Checar imports case-sensitive

### Database Connection
- Adicionar `?sslmode=require` na DATABASE_URL
- Verificar IP whitelist no Supabase

### CORS Issues
- Verificar CLIENT_URL está correto
- Atualizar CORS_ORIGIN nas envs

## 📊 Otimizações

### 1. Edge Functions
Para endpoints rápidos:
```typescript
export const config = {
  runtime: 'edge',
};
```

### 2. ISR (Incremental Static Regeneration)
Para páginas semi-estáticas:
```typescript
export const revalidate = 3600; // 1 hora
```

### 3. Image Optimization
Use `next/image` ou Vercel Image Optimization

## ✅ Checklist Final

- [ ] Build local funcionando
- [ ] Todas as envs configuradas
- [ ] Deploy bem-sucedido
- [ ] Testes manuais passed
- [ ] Domínio configurado
- [ ] SSL ativo (automático)
- [ ] Monitoring configurado

## 🎉 Parabéns!

Seu True Label está no ar! 

URLs importantes:
- App: `https://seu-app.vercel.app`
- API: `https://seu-app.vercel.app/api`
- Docs: `https://seu-app.vercel.app/api/docs`

## 📝 Próximos Passos

1. Configurar backups automáticos (Supabase)
2. Adicionar monitoring (Sentry)
3. Configurar alerts (Uptime)
4. Otimizar performance
5. Adicionar CDN para assets