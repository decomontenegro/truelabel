# 🚀 TRUST LABEL - Início Rápido

## ✅ Opção 1: Teste Imediato (Sem Instalação)

1. **Abra o arquivo HTML no navegador:**
   ```bash
   open /Users/andremontenegro/TRUST-LABEL/start-simple.html
   ```

2. **Você verá a interface do TRUST LABEL funcionando!**

## ⚡ Opção 2: Com Backend Simples

### Passo 1: Instalar dependências do servidor
```bash
cd /Users/andremontenegro/TRUST-LABEL
npm init -y
npm install express cors
```

### Passo 2: Iniciar o servidor
```bash
node server-simple.js
```

### Passo 3: Abrir o frontend
Em outro terminal ou no navegador:
```bash
open start-simple.html
```

### Passo 4: Testar
- Clique no botão "Testar API" para verificar a conexão
- O servidor responderá com status OK

## 📱 O que está funcionando:

1. **Frontend HTML** com Tailwind CSS
2. **Servidor Express** com CORS habilitado
3. **Endpoints de API:**
   - `/api/health` - Status do servidor
   - `/api/products` - Lista de produtos
   - `/api/auth/login` - Login simulado

## 🔧 Próximos Passos:

1. **Adicionar banco de dados** (PostgreSQL)
2. **Implementar autenticação real** com JWT
3. **Criar páginas React/Next.js** completas
4. **Adicionar funcionalidades de IA**

## 💡 Dica Rápida:

Para ver tudo funcionando agora mesmo:
```bash
# Terminal 1
cd /Users/andremontenegro/TRUST-LABEL
npm install express cors
node server-simple.js

# Terminal 2 (ou navegador)
open start-simple.html
```

---

**Pronto!** Você tem o TRUST LABEL rodando localmente! 🎉