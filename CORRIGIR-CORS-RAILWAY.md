# 🔧 CORRIGIR CORS NO RAILWAY

## 🚨 Problema
O frontend na Vercel não consegue se comunicar com o backend no Railway devido ao erro de CORS.

## ✅ Solução Rápida

### 1. **Acesse o Railway**
1. Entre em https://railway.app
2. Acesse o projeto `truelabel-production`

### 2. **Adicione a URL da Vercel ao CORS**
No painel do Railway, vá em **Variables** e atualize:

```env
CORS_ORIGIN="https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app,https://dist-plum-eight.vercel.app"
```

### 3. **Redeploy**
Clique em **Redeploy** para aplicar as mudanças.

## 🛠️ Solução Permanente

### Opção 1: Usar domínio customizado
1. Configure um domínio customizado na Vercel
2. Atualize o CORS_ORIGIN com o domínio final

### Opção 2: Permitir múltiplas origens
Adicione todas as URLs possíveis:
```env
CORS_ORIGIN="https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app,https://truelabel.vercel.app,https://www.truelabel.com.br,http://localhost:3001,http://localhost:9101"
```

### Opção 3: Usar wildcard (menos seguro)
```env
CORS_ORIGIN="https://*.vercel.app"
```

## 📝 Verificar se funcionou
1. Abra o console do navegador
2. Tente fazer login
3. Não deve mais aparecer erro de CORS

## 🔍 Debug
Se ainda tiver problemas, verifique:
1. Se o Railway reiniciou o servidor
2. Se a variável foi salva corretamente
3. Use o curl para testar:

```bash
curl -X OPTIONS https://truelabel-production.up.railway.app/auth/login \
  -H "Origin: https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```