#!/bin/bash

echo "🚀 Iniciando True Label..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parar processos anteriores
echo "🛑 Parando processos anteriores..."
pkill -f "tsx src/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Função para iniciar o backend
start_backend() {
    echo -e "${BLUE}📦 Iniciando backend...${NC}"
    cd /Users/andremontenegro/true\ label/server
    npm run dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
}

# Função para iniciar o frontend
start_frontend() {
    echo -e "${BLUE}🎨 Iniciando frontend...${NC}"
    cd /Users/andremontenegro/true\ label/client
    PORT=9101 npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
}

# Iniciar serviços
start_backend
sleep 5 # Aguardar backend iniciar
start_frontend

echo -e "\n${GREEN}✅ Sistema iniciado com sucesso!${NC}"
echo -e "Backend: http://localhost:9100"
echo -e "Frontend: http://localhost:9101"
echo -e "\nPressione Ctrl+C para parar"

# Aguardar
wait