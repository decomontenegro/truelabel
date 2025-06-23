#!/bin/bash

echo "🔧 Resolvendo problemas de login do True Label..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "1️⃣ Verificando Node.js..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js não está instalado!${NC}"
    echo "Por favor, instale Node.js 18+ de: https://nodejs.org"
    exit 1
fi

# Check npm
echo ""
echo "2️⃣ Verificando npm..."
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm não está instalado!${NC}"
    exit 1
fi

# Kill existing processes
echo ""
echo "3️⃣ Liberando portas..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ Portas 3000 e 3001 liberadas${NC}"

# Check backend directory
echo ""
echo "4️⃣ Verificando estrutura do projeto..."
if [ -d "../server" ]; then
    echo -e "${GREEN}✓ Diretório do servidor encontrado${NC}"
else
    echo -e "${RED}✗ Diretório do servidor não encontrado!${NC}"
    echo "Estrutura esperada:"
    echo "  true label/"
    echo "    ├── client/ (você está aqui)"
    echo "    └── server/"
    exit 1
fi

# Install backend dependencies
echo ""
echo "5️⃣ Instalando dependências do backend..."
echo -e "${YELLOW}Executando: cd ../server && npm install${NC}"
(cd ../server && npm install) || {
    echo -e "${RED}✗ Erro ao instalar dependências do backend${NC}"
    exit 1
}
echo -e "${GREEN}✓ Dependências do backend instaladas${NC}"

# Check if database exists
echo ""
echo "6️⃣ Verificando banco de dados..."
if [ -f "../server/prisma/dev.db" ]; then
    echo -e "${GREEN}✓ Banco de dados encontrado${NC}"
else
    echo -e "${YELLOW}! Banco de dados não encontrado, criando...${NC}"
    (cd ../server && npx prisma generate && npx prisma db push) || {
        echo -e "${RED}✗ Erro ao criar banco de dados${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Banco de dados criado${NC}"
fi

# Start backend
echo ""
echo "7️⃣ Iniciando backend..."
echo -e "${YELLOW}Backend rodando na porta 3000...${NC}"
(cd ../server && npm run dev > backend.log 2>&1 &)
BACKEND_PID=$!

# Wait for backend to start
echo "Aguardando backend iniciar..."
for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend iniciado com sucesso!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Test backend
echo ""
echo "8️⃣ Testando backend..."
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if [ -n "$HEALTH_CHECK" ]; then
    echo -e "${GREEN}✓ Backend respondendo corretamente${NC}"
else
    echo -e "${RED}✗ Backend não está respondendo${NC}"
    echo "Verifique ../server/backend.log para erros"
    exit 1
fi

# Start frontend
echo ""
echo "9️⃣ Iniciando frontend..."
echo -e "${YELLOW}Frontend rodando na porta 3001...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait a bit
sleep 3

# Show success message
echo ""
echo -e "${GREEN}✨ True Label iniciado com sucesso!${NC}"
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000"
echo ""
echo "🔑 Credenciais de login:"
echo "   Admin: admin@truelabel.com / admin123"
echo "   Marca: marca@exemplo.com / marca123"
echo ""
echo "📝 Para testar a conexão: http://localhost:3001/test-connection"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar os servidores${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "👋 Até logo!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep running
wait