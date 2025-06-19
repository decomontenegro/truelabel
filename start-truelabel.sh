#!/bin/bash

# True Label - Script de Inicialização Corrigido

echo "🚀 Iniciando True Label (Frontend + Backend)"
echo "==========================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Função para matar processo em porta
kill_port() {
    local PORT=$1
    local PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Matando processo na porta $PORT...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
}

# Limpar portas
echo -e "${YELLOW}Limpando portas...${NC}"
kill_port 3000  # Fusetech
kill_port 5001  # Porta antiga
kill_port 5173  # Vite padrão
kill_port 9100  # Backend

# Matar processos específicos
pkill -f "next-server" || true
pkill -f "vite" || true
sleep 2

# Função de limpeza
cleanup() {
    echo -e "\n${YELLOW}Encerrando True Label...${NC}"
    kill_port 5173
    kill_port 9100
    pkill -f "tsx src/index.ts" || true
    pkill -f "vite" || true
    echo -e "${GREEN}✅ Encerramento completo${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# 1. Iniciar Backend
echo -e "\n${GREEN}1. Iniciando Backend (porta 9100)...${NC}"
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend
echo -e "${YELLOW}   Aguardando backend iniciar...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:9100/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend rodando!${NC}"
        break
    fi
    sleep 1
done

# 2. Iniciar Frontend
echo -e "\n${GREEN}2. Iniciando Frontend (porta 5173)...${NC}"
cd "../true label /client"

# Forçar porta 5173
export VITE_PORT=5173
export PORT=9100
export VITE_API_BASE_URL=http://localhost:9100/api/v1

# Iniciar Vite com configuração específica
npm run dev -- --port 5173 --host &
FRONTEND_PID=$!

cd "../../true label"

# Aguardar frontend
echo -e "${YELLOW}   Aguardando frontend iniciar...${NC}"
sleep 5

# Verificar se está rodando
for i in {1..20}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Frontend rodando!${NC}"
        break
    fi
    sleep 1
done

# Informações finais
echo -e "\n${GREEN}✨ True Label está rodando!${NC}"
echo -e "\n${YELLOW}URLs de acesso:${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "Backend API: ${GREEN}http://localhost:9100${NC}"
echo -e "API Docs: ${GREEN}http://localhost:9100/api-docs${NC}"
echo -e "\n${YELLOW}Credenciais:${NC}"
echo -e "Email: admin@truelabel.com"
echo -e "Senha: Admin123!@#"

# Abrir no navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open "http://localhost:5173"
fi

echo -e "\n${YELLOW}Pressione Ctrl+C para encerrar${NC}\n"

# Manter rodando
wait