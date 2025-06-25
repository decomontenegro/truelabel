# 🚀 Como Executar o True Label Localmente

## 📋 Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**

## 🔧 Passos para Executar

### 1. **Instalar Dependências**

Abra seu terminal e execute:

```bash
# Navegar para o diretório do projeto
cd "/Users/andremontenegro/true label"

# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do cliente
cd ../client
npm install

# Voltar para a raiz
cd ..
```

### 2. **Configurar Banco de Dados (Servidor)**

```bash
cd server

# Gerar cliente Prisma
npm run generate

# Executar migrações
npm run migrate

# Popular banco com dados de teste
npm run seed
```

### 3. **Iniciar os Servidores**

#### **Opção A: Iniciar Ambos Automaticamente**
```bash
# Na raiz do projeto
npm run dev
```

#### **Opção B: Iniciar Separadamente**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 4. **Acessar a Aplicação**

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (execute `npm run studio` no server)

## 👥 **Credenciais de Teste**

```
Admin: admin@truelabel.com / admin123
Brand: marca@exemplo.com / marca123
Lab: analista@labexemplo.com / lab123
Validator: validador@truelabel.com / validator123
```

## 🧪 **Testar Funcionalidades**

### **1. Login e Dashboard**
1. Acesse http://localhost:3001
2. Clique em "Login"
3. Use uma das credenciais acima
4. Explore o dashboard específico do role

### **2. Criar Produto (como Brand)**
1. Login como `marca@exemplo.com / marca123`
2. Ir para "Produtos" → "Novo Produto"
3. Preencher informações
4. Salvar produto

### **3. Gerar QR Code**
1. No produto criado, clicar em "Gerar QR Code"
2. QR code será gerado automaticamente
3. Copiar URL do QR code

### **4. Testar Validação Pública**
1. Abrir nova aba (sem login)
2. Acessar URL do QR code
3. Ver página de validação pública

## 🔍 **Páginas de Teste Disponíveis**

### **Testes HTML (Abrir no Browser)**
- `client/test-auth-flow.html` - Teste de autenticação
- `client/test-qr-flow.html` - Teste de QR codes
- `client/test-laboratory-flow.html` - Teste de laboratório

### **Testes de Desenvolvimento**
- http://localhost:3001/design-system - Design system
- http://localhost:3001/test-connection - Teste de conexão
- http://localhost:3001/dashboard/test-qr - Teste de QR codes

## 🛠️ **Comandos Úteis**

### **Desenvolvimento**
```bash
# Verificar tipos TypeScript
cd client && npm run type-check
cd server && npm run type-check

# Executar linting
cd client && npm run lint
cd server && npm run lint

# Executar testes
cd client && npm test
cd server && npm test

# Build de produção
cd client && npm run build
```

### **Banco de Dados**
```bash
cd server

# Abrir Prisma Studio (GUI do banco)
npm run studio

# Reset completo do banco
npm run db:reset

# Ver logs do banco
npm run migrate -- --verbose
```

### **Debug**
```bash
# Verificar se servidores estão rodando
lsof -i :3000  # Backend
lsof -i :3001  # Frontend

# Verificar logs
cd server && npm run dev -- --verbose
cd client && npm run dev -- --debug
```

## 🚨 **Troubleshooting**

### **Erro de Porta Ocupada**
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Matar processo na porta 3001
lsof -ti:3001 | xargs kill -9
```

### **Erro de Banco de Dados**
```bash
cd server

# Resetar banco completamente
rm -f prisma/dev.db
npm run migrate
npm run seed
```

### **Erro de Dependências**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Fazer isso em ambos client/ e server/
```

### **Erro de CORS**
- Verificar se `VITE_API_BASE_URL` está correto no `client/.env`
- Deve ser: `http://localhost:3000/api/v1`

## 📱 **Testando QR Codes**

### **1. Gerar QR Code**
1. Login como Brand
2. Criar/editar produto
3. Clicar em "Gerar QR Code"
4. Copiar URL gerada

### **2. Testar Validação**
1. Abrir nova aba (modo anônimo)
2. Acessar: `http://localhost:3001/validation/[QR_CODE]`
3. Ver informações do produto

### **3. Testar com Celular**
1. Conectar celular na mesma rede WiFi
2. Descobrir IP local: `ifconfig | grep inet`
3. Acessar: `http://[SEU_IP]:3001/validation/[QR_CODE]`

## 🎯 **Fluxo Completo de Teste**

### **Cenário: Validação de Produto**

1. **Como Brand:**
   - Criar produto com claims
   - Gerar QR code

2. **Como Laboratory:**
   - Upload de relatório de análise
   - Vincular ao produto

3. **Como Validator:**
   - Revisar validação
   - Aprovar/rejeitar

4. **Como Consumidor:**
   - Escanear QR code
   - Ver produto validado

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs** nos terminais do servidor e cliente
2. **Consultar documentação** em `CLAUDE.md`
3. **Executar testes** com `./verify-fixes.sh`
4. **Verificar configurações** de ambiente

---

**🎉 Agora você pode explorar completamente o True Label localmente!**
