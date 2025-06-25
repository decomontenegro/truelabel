# 🚨 ATUALIZAR CORS NO RAILWAY - URGENTE!

## 📋 Copie e cole este valor no Railway:

### Na variável CORS_ORIGIN, adicione:
```
https://dist-kitfykqu1-decos-projects-925dd01d.vercel.app,https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app,https://dist-plum-eight.vercel.app,http://localhost:3001,http://localhost:9101
```

## 🔧 Como fazer:

1. **Acesse Railway**
   - https://railway.app
   - Entre no projeto "truelabel-production"

2. **Vá em Variables**
   - Procure por `CORS_ORIGIN`
   - Se não existir, crie uma nova

3. **Cole o valor acima**
   - Certifique-se de incluir TODAS as URLs
   - Não use espaços entre as vírgulas

4. **Salve e faça Redeploy**
   - Clique em "Save"
   - Depois em "Redeploy"

## 🧪 Alternativa temporária (APENAS PARA TESTE):

Se quiser testar rapidamente, use:
```
CORS_ORIGIN=*
```

⚠️ **IMPORTANTE**: Volte para URLs específicas depois!

## 🔍 Verificar se funcionou:

Execute este comando após o redeploy:
```bash
curl -X OPTIONS https://truelabel-production.up.railway.app/auth/login \
  -H "Origin: https://dist-kitfykqu1-decos-projects-925dd01d.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control-allow-origin"
```

Deve retornar:
```
< access-control-allow-origin: https://dist-kitfykqu1-decos-projects-925dd01d.vercel.app
```

## 📝 URLs que devem estar no CORS:
- ✅ https://dist-kitfykqu1-decos-projects-925dd01d.vercel.app (NOVA)
- ✅ https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app
- ✅ https://dist-plum-eight.vercel.app
- ✅ http://localhost:3001
- ✅ http://localhost:9101