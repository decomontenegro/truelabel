# 🚀 Guia de Configuração para Produção - True Label

## 📋 Checklist Rápido

- [ ] PostgreSQL configurado
- [ ] Redis configurado (opcional mas recomendado)
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio e SSL configurados
- [ ] Serviço de email configurado
- [ ] Sentry configurado (monitoramento)
- [ ] Backup configurado

## 🗄️ 1. Configurar PostgreSQL

### Opções Recomendadas:
- **Supabase** (grátis até 500MB)
- **Neon** (grátis até 3GB)
- **Railway** (grátis com limites)
- **DigitalOcean** ($15/mês)

### Configuração:
1. Criar banco de dados PostgreSQL
2. Obter URL de conexão
3. Atualizar `DATABASE_URL` no `.env`:
```env
DATABASE_URL=postgresql://usuario:senha@host:5432/database?sslmode=require
```

4. Executar migrações:
```bash
cd server
npx prisma migrate deploy
npm run seed  # Opcional: dados de exemplo
```

## 🔴 2. Configurar Redis (Opcional mas Recomendado)

### Opções:
- **Upstash** (grátis até 10k comandos/dia)
- **Redis Cloud** (grátis até 30MB)
- **Railway Redis** (grátis com limites)

### Configuração:
```env
REDIS_ENABLED=true
REDIS_URL=redis://default:senha@host:6379
```

## 📧 3. Configurar Email (Nodemailer)

### Opções:
- **SendGrid** (100 emails/dia grátis)
- **Mailgun** (5k emails/mês grátis)
- **SMTP próprio** (Gmail, Outlook, etc)

### Configuração para SendGrid:
```env
EMAIL_ENABLED=true
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
EMAIL_FROM=noreply@truelabel.com
```

### Configuração para SMTP:
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app
EMAIL_FROM=seu-email@gmail.com
```

## 🔐 4. Variáveis de Ambiente Essenciais

### Backend (server/.env):
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Security
JWT_SECRET=gere-uma-chave-super-segura-aqui
NODE_ENV=production

# Server
PORT=9100

# Redis (opcional)
REDIS_ENABLED=true
REDIS_URL=redis://default:senha@host:6379

# Email
EMAIL_ENABLED=true
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Sentry (monitoramento)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_WINDOW=15min
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (client/.env.production):
```env
VITE_API_BASE_URL=https://api.truelabel.com/api/v1
VITE_QR_BASE_URL=https://truelabel.com
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## 🌐 5. Configurar Domínio e SSL

### Cloudflare (Recomendado):
1. Adicionar domínio no Cloudflare
2. Configurar DNS apontando para servidor
3. Ativar SSL/TLS no modo "Full (strict)"
4. Ativar proxy (nuvem laranja)

### Nginx (se usar VPS):
```nginx
server {
    listen 80;
    server_name api.truelabel.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.truelabel.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:9100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 6. Configurar Monitoramento

### Sentry:
1. Criar conta em sentry.io
2. Criar projeto para Node.js
3. Criar projeto para React
4. Adicionar DSNs nas variáveis de ambiente

### PM2 (Process Manager):
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server/dist/index.js --name truelabel-api

# Salvar configuração
pm2 save
pm2 startup
```

## 💾 7. Configurar Backups

### Backup Automático do Banco:
```bash
# Criar script backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload para S3/Google Drive/etc
```

### Agendar com cron:
```bash
# Backup diário às 3h
0 3 * * * /path/to/backup.sh
```

## 🚀 8. Deploy

### Opção 1: Vercel (Mais Fácil)
```bash
# Já configurado! Apenas:
vercel --prod
```

### Opção 2: VPS (DigitalOcean, AWS, etc)
```bash
# No servidor
git clone <seu-repo>
cd true-label

# Backend
cd server
npm install
npm run build
pm2 start dist/index.js --name truelabel-api

# Frontend
cd ../client
npm install
npm run build
# Servir dist/ com nginx
```

### Opção 3: Docker
```bash
docker-compose up -d
```

## ✅ 9. Verificação Final

1. **Testar endpoints críticos:**
   - [ ] POST /api/v1/auth/login
   - [ ] GET /api/v1/products
   - [ ] POST /api/v1/qr/generate
   - [ ] GET /public/validate/:qrCode

2. **Verificar funcionalidades:**
   - [ ] Login/Registro funcionando
   - [ ] Upload de arquivos
   - [ ] Geração de QR codes
   - [ ] Página pública de validação

3. **Monitorar primeira semana:**
   - [ ] Logs de erro
   - [ ] Performance
   - [ ] Uso de recursos

## 🆘 Troubleshooting

### Erro de conexão com banco:
- Verificar DATABASE_URL
- Verificar se IP está liberado no firewall do banco
- Testar conexão: `npx prisma db pull`

### Erro de CORS:
- Adicionar domínio do frontend em `ALLOWED_ORIGINS`
- Verificar configuração do Cloudflare

### Performance lenta:
- Ativar Redis
- Verificar índices do banco
- Ativar compressão no nginx

## 📞 Suporte

Em caso de dúvidas:
1. Verificar logs: `pm2 logs`
2. Verificar Sentry para erros
3. Consultar documentação
4. Abrir issue no GitHub