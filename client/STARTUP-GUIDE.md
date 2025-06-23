# 🚀 Como Iniciar o True Label

## Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

## Instalação

### 1. Instalar dependências do Backend
```bash
cd ../server
npm install
```

### 2. Instalar dependências do Frontend
```bash
cd ../client
npm install
```

## Iniciando a Aplicação

### Opção 1: Script Automático (Recomendado)
Na pasta do cliente, execute:
```bash
./start-all.sh
```

Este script irá:
- Verificar as portas 3000 (backend) e 3001 (frontend)
- Iniciar o servidor backend
- Iniciar o servidor frontend
- Mostrar os URLs de acesso

### Opção 2: Manual
Em terminais separados:

**Terminal 1 - Backend:**
```bash
cd ../server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ../client
npm run dev
```

## Acessando a Aplicação

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

## Credenciais de Teste

### Administrador
- Email: admin@truelabel.com
- Senha: admin123

### Marca
- Email: marca@exemplo.com
- Senha: marca123

### Laboratório
- Email: analista@labexemplo.com
- Senha: lab123

### Validador
- Email: validador@truelabel.com
- Senha: validator123

## Teste de Conexão

Após iniciar os servidores, acesse:
http://localhost:3001/test-connection

Esta página irá testar:
1. Conexão com o backend
2. Login com credenciais admin
3. Listagem de produtos
4. Criação de produto teste

## Solução de Problemas

### Erro de Login
1. Verifique se o backend está rodando na porta 3000
2. Teste a conexão em http://localhost:3001/test-connection
3. Verifique o console do navegador para erros

### Portas em Uso
Se as portas 3000 ou 3001 estiverem em uso:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro de CORS
O frontend está configurado para proxy requests para o backend.
Certifique-se de que ambos os servidores estão rodando.

## Estrutura do Projeto

```
true label/
├── client/          # Frontend React + TypeScript
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Backend Node.js + Express
│   ├── src/
│   ├── prisma/
│   └── package.json
└── README.md
```

## Desenvolvimento

### Frontend
- React 18 + TypeScript
- Vite para build
- Tailwind CSS
- Zustand para estado
- React Router v6

### Backend
- Node.js + Express
- Prisma ORM
- SQLite (desenvolvimento)
- JWT para autenticação

## Funcionalidades Principais

1. **Gestão de Produtos**
2. **Validação Automatizada**
3. **QR Codes Dinâmicos**
4. **Análise de Laudos**
5. **Ciclo de Vida de Validações**
6. **Dashboard Analytics**

## Páginas de Teste

- `/dashboard/test-validation-rules` - Teste de regras de validação
- `/dashboard/test-report-parser` - Parser de laudos
- `/dashboard/test-automated-validation` - Validação automática
- `/dashboard/test-qr-lifecycle` - Ciclo de vida QR
- `/dashboard/validations/lifecycle` - Monitoramento