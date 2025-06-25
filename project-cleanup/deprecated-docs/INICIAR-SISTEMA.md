# 🚀 Como Iniciar o Sistema True Label

## Método 1: Comando Único (Recomendado)

Abra o terminal e execute:

```bash
cd /Users/andremontenegro/true\ label
npm run dev:all
```

Aguarde até ver:
- Backend: "🚀 Servidor rodando na porta 9100"
- Frontend: "➜  Local:   http://localhost:9101/"

## Método 2: Dois Terminais

### Terminal 1 - Backend:
```bash
cd /Users/andremontenegro/true\ label/server
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd /Users/andremontenegro/true\ label/client
npm run dev
```

## 📌 URLs do Sistema

- **Frontend (Interface)**: http://localhost:9101
- **Backend (API)**: http://localhost:9100
- **API Docs**: http://localhost:9100/api-docs

## 🔑 Credenciais

- **Admin**: admin@cpgvalidation.com / admin123
- **Marca**: marca@exemplo.com / brand123
- **Lab**: analista@labexemplo.com / lab123

## ⚠️ Solução de Problemas

### Se não abrir:

1. **Verificar se as portas estão livres**:
```bash
lsof -i :9100
lsof -i :9101
```

2. **Matar processos antigos**:
```bash
pkill -f "node"
pkill -f "tsx"
pkill -f "vite"
```

3. **Tentar novamente**:
```bash
cd /Users/andremontenegro/true\ label
npm run dev:all
```

### Se ainda não funcionar:

4. **Limpar cache e reinstalar**:
```bash
cd /Users/andremontenegro/true\ label
rm -rf node_modules client/node_modules server/node_modules
npm install
cd client && npm install
cd ../server && npm install
cd ..
npm run dev:all
```

## ✅ Sistema Funcionando!

Quando o sistema estiver rodando corretamente, você verá no terminal:
- Mensagens de log do backend
- URL do frontend (http://localhost:9101)

Então é só abrir o navegador e acessar!