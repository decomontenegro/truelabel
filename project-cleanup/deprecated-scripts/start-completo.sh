#!/bin/bash

echo "🚀 True Label - Sistema Completo"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Diretórios
CURRENT_DIR="$(pwd)"
CLIENT_DIR="/Users/andremontenegro/true label /client"

# Função para matar processos em portas
kill_ports() {
    echo -e "${YELLOW}Limpando portas...${NC}"
    lsof -t -i:9100 | xargs kill -9 2>/dev/null || true
    lsof -t -i:5173 | xargs kill -9 2>/dev/null || true
    pkill -f "tsx src/index.ts" || true
    pkill -f "vite" || true
    sleep 2
}

# Limpar portas
kill_ports

# Função de limpeza ao sair
cleanup() {
    echo -e "\n${YELLOW}Encerrando serviços...${NC}"
    kill_ports
    echo -e "${GREEN}✅ Encerrado${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# 1. Backend
echo -e "${GREEN}1. Iniciando Backend (porta 9100)...${NC}"
cd "$CURRENT_DIR/server"
npm run dev 2>&1 | tee ../backend.log &
BACKEND_PID=$!

# Aguardar backend
echo "   Aguardando backend..."
sleep 5
if curl -s http://localhost:9100/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backend OK${NC}"
else
    echo -e "   ${RED}❌ Backend falhou${NC}"
fi

# 2. Frontend
echo -e "\n${GREEN}2. Iniciando Frontend (porta 5173)...${NC}"
cd "$CLIENT_DIR"
npm run dev -- --port 5173 2>&1 | tee "$CURRENT_DIR/frontend.log" &
FRONTEND_PID=$!

# Aguardar frontend
echo "   Aguardando frontend..."
sleep 8

# Verificar se está rodando
FRONTEND_OK=false
for i in {1..10}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        FRONTEND_OK=true
        echo -e "   ${GREEN}✅ Frontend OK${NC}"
        break
    fi
    sleep 1
done

if [ "$FRONTEND_OK" = false ]; then
    echo -e "   ${RED}❌ Frontend não respondeu${NC}"
fi

# Informações
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ True Label Rodando!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🌐 Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "📡 Backend: ${GREEN}http://localhost:9100${NC}"
echo -e "📚 API Docs: ${GREEN}http://localhost:9100/api-docs${NC}"
echo ""
echo -e "🔑 Login:"
echo "   Email: admin@truelabel.com"
echo "   Senha: Admin123!@#"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""

# Abrir navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}Abrindo navegador...${NC}"
    sleep 2
    open "http://localhost:5173"
fi

echo -e "\n${YELLOW}Pressione Ctrl+C para encerrar${NC}\n"

# Manter rodando
wait