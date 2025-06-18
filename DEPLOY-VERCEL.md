# 🚀 Deploy do True Label no Vercel

## Pré-requisitos ✅

Certifique-se de ter configurado:
- [ ] PostgreSQL (Supabase/Neon)
- [ ] Email Provider (SendGrid)
- [ ] Redis (Upstash) - opcional mas recomendado
- [ ] Conta no GitHub com o código
- [ ] Conta no Vercel

## 1. Preparar o Código

### Verificar arquivos essenciais:
```bash
# Na raiz do projeto
ls vercel.json package.json vercel-build.sh

# Devem existir:
# ✓ vercel.json
# ✓ package.json
# ✓ vercel-build.sh
```

### Fazer commit final:
```bash
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

## 2. Conectar ao Vercel

### Opção A: Via Dashboard (Recomendado)
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe do GitHub
3. Selecione o repositório `true-label`
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (deixe vazio)
   - **Build Command**: `./vercel-build.sh`
   - **Output Directory**: `client/dist`

### Opção B: Via CLI
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts:
# - Set up and deploy? Yes
# - Which scope? (selecione sua conta)
# - Link to existing project? No
# - Project name? true-label
# - Directory? ./
# - Override settings? Yes
```

## 3. Configurar Variáveis de Ambiente

### No Dashboard Vercel:
1. Vá em Settings → Environment Variables
2. Adicione TODAS as variáveis:

#### Backend (Essenciais)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=gere-uma-chave-super-segura-aqui-32-chars-min
```

#### Frontend (VITE_*)
```env
VITE_API_BASE_URL=https://true-label.vercel.app/api/v1
VITE_QR_BASE_URL=https://true-label.vercel.app
VITE_ENVIRONMENT=production
```

#### Email
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
EMAIL_FROM_NAME=True Label
```

#### Redis (Opcional)
```env
REDIS_ENABLED=true
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

#### Outros
```env
FRONTEND_URL=https://true-label.vercel.app
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
RATE_LIMIT_WINDOW=15min
RATE_LIMIT_MAX_REQUESTS=100
```

## 4. Deploy

### Deploy Inicial:
```bash
vercel --prod
```

### Verificar Build:
1. No dashboard, vá em "Deployments"
2. Clique no deployment mais recente
3. Verifique os logs de build
4. Procure por erros

## 5. Configurar Domínio (Opcional)

### Domínio customizado:
1. Settings → Domains
2. Add domain: `app.seudominio.com`
3. Configure DNS:
   ```
   CNAME app -> cname.vercel-dns.com
   ```

### Atualizar variáveis:
```env
VITE_API_BASE_URL=https://app.seudominio.com/api/v1
VITE_QR_BASE_URL=https://app.seudominio.com
FRONTEND_URL=https://app.seudominio.com
```

## 6. Pós-Deploy

### 1. Migrar Banco de Dados:
```bash
# Localmente, com DATABASE_URL de produção
cd server
npx prisma migrate deploy
npm run seed # Opcional: dados iniciais
```

### 2. Testar Funcionalidades:
- [ ] Login/Registro
- [ ] Criar produto
- [ ] Upload de arquivo
- [ ] Gerar QR Code
- [ ] Página pública de validação
- [ ] Envio de emails

### 3. Monitorar:
- Vercel Analytics
- Logs de função
- Sentry (se configurado)

## 🔧 Troubleshooting

### Build falha
```bash
# Verificar logs
vercel logs

# Testar build local
./vercel-build.sh
```

### API retorna 404
- Verificar rotas em `vercel.json`
- Confirmar que `/api/index.js` existe
- Checar variáveis de ambiente

### Erro de CORS
- Verificar `FRONTEND_URL` nas variáveis
- Confirmar origem em `server/src/index.ts`

### Database connection failed
- Verificar `DATABASE_URL`
- Testar conexão local:
```bash
cd server
npx prisma db pull
```

### Emails não chegam
- Verificar configuração SendGrid
- Checar logs: `grep "Email" vercel logs`
- Testar sender verification

## 📊 Monitoramento

### Vercel Dashboard
- **Analytics**: Visitas e performance
- **Functions**: Uso e erros
- **Logs**: Tempo real

### Comandos Úteis
```bash
# Ver logs
vercel logs

# Ver deployments
vercel ls

# Rollback
vercel rollback

# Variáveis de ambiente
vercel env ls
```

## ✅ Checklist Final

- [ ] Build passou sem erros
- [ ] Todas variáveis configuradas
- [ ] Banco de dados migrado
- [ ] Login funcionando
- [ ] QR codes gerando
- [ ] Emails enviando
- [ ] Domínio configurado (opcional)
- [ ] SSL funcionando
- [ ] Monitoramento ativo

## 🎉 Parabéns!

True Label está no ar! 

### Links Importantes:
- **Aplicação**: https://true-label.vercel.app
- **API**: https://true-label.vercel.app/api/v1
- **Docs**: https://true-label.vercel.app/api-docs
- **Health**: https://true-label.vercel.app/health

### Próximos Passos:
1. Configurar backups automáticos
2. Implementar CI/CD com GitHub Actions
3. Adicionar monitoramento avançado
4. Configurar CDN para assets

## 📞 Suporte

Problemas? 
- Vercel Status: status.vercel.com
- Docs: vercel.com/docs
- True Label Issues: github.com/yourusername/true-label/issues