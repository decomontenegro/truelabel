# 🚨 SOLUÇÃO TEMPORÁRIA PARA CORS

## ⚡ Solução Rápida: Extensão do Chrome

### 1. Instale a extensão "CORS Unblock"
- Chrome: https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino
- Firefox: Use "CORS Everywhere"

### 2. Ative a extensão
- Clique no ícone da extensão
- Ative o toggle para ON
- Recarregue a página

### 3. Teste o login
- Agora deve funcionar!
- ⚠️ **LEMBRE DE DESATIVAR DEPOIS**

## 🔧 Solução Definitiva: Atualizar Railway

### No Railway, adicione estas variáveis:

```env
CORS_ORIGIN=https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app,https://dist-plum-eight.vercel.app,http://localhost:3001,http://localhost:9101
FRONTEND_URL=https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app
```

### Ou temporariamente (APENAS PARA TESTE):
```env
CORS_ORIGIN=*
```

## 🐛 Debug: Verificar se CORS está configurado

```bash
# Teste o preflight
curl -X OPTIONS https://truelabel-production.up.railway.app/auth/login \
  -H "Origin: https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Deve retornar header:
# Access-Control-Allow-Origin: https://dist-d8nfs5z5o-decos-projects-925dd01d.vercel.app
```

## 📝 Notas
- O backend está online e funcionando
- O problema é apenas a configuração de CORS
- A extensão é segura para testes locais
- Não use a extensão em produção!