# 🚀 Guia de Deploy True Label - Vercel

## 📋 Pré-requisitos

1. **Código da aplicação completo** nos diretórios:
   - `/client` - Frontend React + Vite
   - `/server` - Backend Node.js + Express

2. **Conta no Vercel** com projeto configurado

3. **Banco de dados PostgreSQL** em produção (ex: Supabase, Neon, Railway)

## 🔧 Passos para Deploy

### 1. Preparar o Código

```bash
# Adicionar código da aplicação (se ainda não estiver presente)
git add client/ server/
git commit -m "Add True Label application code"
git push origin main
```

### 2. Configurar Variáveis de Ambiente no Vercel

No dashboard do Vercel, adicione estas variáveis:

#### Frontend (VITE_*)
```
VITE_API_BASE_URL=https://seu-app.vercel.app/api/v1
VITE_QR_BASE_URL=https://seu-app.vercel.app
VITE_ENVIRONMENT=production
```

#### Backend
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=sua-chave-secreta-super-segura
NODE_ENV=production
```

### 3. Configurar Build Settings no Vercel

- **Framework Preset**: Other
- **Root Directory**: (deixe vazio)
- **Build Command**: `./vercel-build.sh`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

### 4. Executar Deploy

```bash
# Opção 1: Via Git (automático)
git add .
git commit -m "fix: configurar deploy Vercel"
git push origin main

# Opção 2: Via CLI
vercel --prod
```

## 🧪 Testar Localmente

```bash
# Testar o build
./test-build.sh

# Simular produção
cd client && npm run build && npm run preview
```

## ⚠️ Troubleshooting

### Tela Branca
1. Verifique se as variáveis VITE_* estão corretas
2. Confirme que `client/dist` foi gerado
3. Verifique os logs de build no Vercel

### Erro 404 nas Rotas
1. Confirme que `vercel.json` está configurado
2. Verifique se o rewrite para SPA está ativo

### API não Funciona
1. Verifique `DATABASE_URL` e conexão
2. Confirme que `JWT_SECRET` está definido
3. Verifique logs da função serverless

## 📝 Checklist Final

- [ ] Código completo nos diretórios client/ e server/
- [ ] Arquivos de configuração criados:
  - [ ] vercel-build.sh (executável)
  - [ ] vercel.json
  - [ ] api/index.js
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build local testado com sucesso
- [ ] Deploy executado

## 🎯 Resultado Esperado

Após o deploy bem-sucedido:
- ✅ Aplicação acessível em https://seu-app.vercel.app
- ✅ Frontend carregando corretamente
- ✅ API respondendo em /api/v1
- ✅ QR codes funcionando
- ✅ Autenticação operacional