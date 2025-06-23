# 🚀 Como Iniciar o True Label

## Opção 1: Iniciar Manualmente (Recomendado)

### 1. Iniciar o Backend (Terminal 1)
```bash
cd "/Users/andremontenegro/true label /server"
npm run dev
```
O backend iniciará na porta **3000**

### 2. Iniciar o Frontend (Terminal 2)
```bash
cd "/Users/andremontenegro/true label /client"
npm run dev
```
O frontend iniciará na porta **3001**

## Opção 2: Script Automático

Se você estiver no diretório pai, pode executar:
```bash
cd "/Users/andremontenegro/true label"
./client/start-all.sh
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api

## ✅ Verificação

1. Acesse http://localhost:3001
2. Você deve ver a página inicial do True Label
3. Tente fazer login ou navegar pelas páginas públicas

## 🛑 Parar os Servidores

- Pressione `Ctrl+C` em cada terminal
- Ou execute: `lsof -ti:3000,3001 | xargs kill -9`

## 📝 Credenciais de Teste (se existirem no seed)

Verifique o arquivo `/server/prisma/seed.ts` para credenciais de teste.

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :3001

# Matar processos nas portas
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Erro de dependências
```bash
# No diretório do servidor
cd "/Users/andremontenegro/true label /server"
npm install

# No diretório do cliente
cd "/Users/andremontenegro/true label /client"
npm install
```

### Erro de banco de dados
```bash
cd "/Users/andremontenegro/true label /server"
npm run generate
npm run migrate
```