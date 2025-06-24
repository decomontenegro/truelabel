# 🧪 INSTRUÇÕES PARA TESTE LOCAL

## ⚡ TESTE RÁPIDO

### 1️⃣ **Iniciar o Backend**
```bash
cd ~/true\ label/server
node src/index-managed.js
```
✅ O servidor vai rodar na porta **3334**

### 2️⃣ **Iniciar o Frontend**
```bash
cd ~/true\ label/client
npm run dev
```
✅ O frontend vai rodar na porta **9101**

### 3️⃣ **URLs Corretas**
- **Frontend**: http://localhost:9101
- **Backend API**: http://localhost:3334
- **Health Check**: http://localhost:3334/health
- **Debug Validações**: http://localhost:3334/debug/validations

### 4️⃣ **Credenciais de Login**
- Email: `admin@cpgvalidation.com`
- Senha: `admin123`

## 🔧 IMPORTANTE: Configurar o Frontend

Antes de testar, precisamos apontar o frontend para o backend local:

**Edite o arquivo** `/client/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3334
```

(Atualmente está apontando para produção)

## 📝 FLUXO DE TESTE

1. **Login** com as credenciais acima
2. **Criar Produto**: 
   - Menu → Produtos → Novo Produto
   - Preencha os dados básicos
3. **Validar Produto**:
   - Na lista, clique em "Validar"
   - Escolha status "Aprovado"
   - Salve
4. **Verificar**:
   - Produto deve aparecer como "VALIDADO"
   - Menu → Validações deve mostrar a validação criada

## 🐛 DEBUGGING

Se algo não funcionar, verifique:

1. **Console do Backend** - Deve mostrar logs como:
   ```
   🔍 GET /validations called with params: {...}
   ✅ Validation created and saved: MANUAL for product...
   ```

2. **Console do Navegador** (F12) - Para erros de frontend

3. **Endpoint de Debug**: http://localhost:3334/debug/validations

## ❌ PROBLEMAS COMUNS

- **"Cannot connect to server"**: Backend não está rodando na porta 3334
- **"Authentication required"**: Token expirou, faça login novamente
- **Dados somem ao recarregar**: Normal! Backend usa memória temporária

## ✅ SUCESSO?

Se tudo funcionar localmente, podemos fazer deploy para produção!