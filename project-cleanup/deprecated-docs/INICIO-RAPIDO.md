# 🚀 True Label - Início Rápido

## 📱 **Ver a Aplicação Agora**

### **Opção 1: Testes HTML (Funcionam Imediatamente)**
Já abri no seu browser:
- **Teste de Autenticação**: `client/test-auth-flow.html`

Outros testes disponíveis:
- **Teste de QR Codes**: `client/test-qr-flow.html`
- **Teste de Laboratório**: `client/test-laboratory-flow.html`

### **Opção 2: Executar Aplicação Completa**

**No seu terminal, execute:**

```bash
# 1. Ir para o diretório do projeto
cd "/Users/andremontenegro/true label"

# 2. Executar script automático
./start-local.sh
```

**Ou manualmente:**

```bash
# 1. Instalar dependências
cd server && npm install
cd ../client && npm install

# 2. Configurar banco
cd ../server
npm run generate
npm run migrate
npm run seed

# 3. Iniciar servidores (2 terminais)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

## 🌐 **URLs da Aplicação**

Após iniciar:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

## 👥 **Login de Teste**

```
Admin: admin@truelabel.com / admin123
Brand: marca@exemplo.com / marca123
Lab: analista@labexemplo.com / lab123
Validator: validador@truelabel.com / validator123
```

## 🎯 **Fluxo de Teste Recomendado**

### **1. Explorar como Brand (Marca)**
1. Login: `marca@exemplo.com / marca123`
2. Ir para "Produtos" → "Novo Produto"
3. Criar produto com claims
4. Gerar QR Code
5. Ver analytics

### **2. Testar Validação Pública**
1. Copiar URL do QR Code gerado
2. Abrir em nova aba (sem login)
3. Ver página de validação pública

### **3. Explorar como Admin**
1. Login: `admin@truelabel.com / admin123`
2. Ver dashboard administrativo
3. Gerenciar validações
4. Ver laboratórios

## 🧪 **Páginas de Teste Especiais**

Após iniciar a aplicação:
- **Design System**: http://localhost:3001/design-system
- **Teste de Conexão**: http://localhost:3001/test-connection
- **QR Test**: http://localhost:3001/dashboard/test-qr

## 📱 **Testar no Celular**

1. Conectar celular na mesma WiFi
2. Descobrir seu IP: `ifconfig | grep inet`
3. Acessar: `http://[SEU_IP]:3001`

## 🔍 **Principais Funcionalidades para Testar**

### ✅ **Sistema de Autenticação**
- Login/logout
- Diferentes roles (Admin, Brand, Lab)
- Dashboards personalizados

### ✅ **Gestão de Produtos**
- Criar produto
- Editar informações
- Upload de imagens
- Claims e informações nutricionais

### ✅ **Sistema de QR Codes**
- Geração automática
- QR codes únicos e permanentes
- Página de validação pública
- Analytics de escaneamento

### ✅ **Validação Laboratorial**
- Upload de relatórios
- Processo de validação
- Aprovação/rejeição

### ✅ **Analytics**
- Dashboard de métricas
- Rastreamento de QR scans
- Relatórios de engajamento

## 🎨 **Interface e Design**

O True Label possui:
- **Design System** completo
- **Interface responsiva** (mobile-first)
- **Componentes reutilizáveis**
- **Tema consistente**
- **Acessibilidade** implementada

## 🔒 **Segurança**

- **JWT Authentication**
- **Rate limiting**
- **QR codes criptograficamente seguros**
- **Validação de dados**
- **Sanitização de inputs**

## 📊 **Dados de Demonstração**

O sistema vem com:
- **Usuários de teste** para cada role
- **Produtos de exemplo**
- **Laboratórios cadastrados**
- **Validações de demonstração**

---

## 🎯 **Próximos Passos**

1. **Execute** `./start-local.sh`
2. **Acesse** http://localhost:3001
3. **Faça login** com as credenciais de teste
4. **Explore** as funcionalidades
5. **Teste** o fluxo completo de validação

**🎉 Divirta-se explorando o True Label!**
