#!/bin/bash

echo "🚀 Iniciando True Label - Sistema Completo"
echo "=========================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Limpar portas
echo -e "${YELLOW}🧹 Limpando portas...${NC}"
lsof -ti:9100 | xargs kill -9 2>/dev/null || true
lsof -ti:9101 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Backend
echo -e "\n${BLUE}📦 Iniciando Backend...${NC}"
cd "/Users/andremontenegro/true label/server"
node server-basic.js > backend.log 2>&1 &
BACKEND_PID=$!

# Aguardar backend
echo "⏳ Aguardando backend iniciar..."
sleep 3

# Verificar backend
if curl -s http://localhost:9100/health > /dev/null; then
    echo -e "${GREEN}✅ Backend rodando em http://localhost:9100${NC}"
else
    echo -e "❌ Erro ao iniciar backend"
    exit 1
fi

# Frontend
echo -e "\n${BLUE}🎨 Iniciando Frontend...${NC}"
cd "/Users/andremontenegro/true label/client"

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "VITE_API_BASE_URL=http://localhost:9100/api/v1" > .env
    echo "VITE_QR_BASE_URL=http://localhost:9101" >> .env
    echo "VITE_ENVIRONMENT=development" >> .env
fi

npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Aguardar frontend
echo "⏳ Aguardando frontend iniciar..."
sleep 5

# Mostrar status
echo -e "\n${GREEN}✅ Sistema True Label iniciado!${NC}"
echo -e "=================================="
echo -e "${BLUE}Backend:${NC} http://localhost:9100"
echo -e "${BLUE}Frontend:${NC} http://localhost:9101"
echo -e "${BLUE}API Docs:${NC} http://localhost:9100/api/v1"
echo -e "\n${YELLOW}📝 Credenciais de teste:${NC}"
echo "admin@truelabel.com / admin123"
echo "marca@exemplo.com / marca123"
echo "analista@labexemplo.com / lab123"
echo -e "\n${YELLOW}📋 Logs:${NC}"
echo "Backend: tail -f server/backend.log"
echo "Frontend: tail -f client/frontend.log"
echo -e "\n${YELLOW}Para parar: Ctrl+C${NC}\n"

# Função para limpar ao sair
cleanup() {
    echo -e "\n${YELLOW}🛑 Parando serviços...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Serviços parados${NC}"
    exit 0
}

trap cleanup INT TERM

# Manter rodando
wait