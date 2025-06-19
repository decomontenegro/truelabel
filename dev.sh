#!/bin/bash

# True Label Development Environment
# Com correção de portas e paths

echo "🚀 True Label - Ambiente de Desenvolvimento"
echo "=========================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Função para matar processo em porta específica
kill_port() {
    local PORT=$1
    local PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Matando processo na porta $PORT (PID: $PID)...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
}

# Limpar portas
echo -e "${YELLOW}Limpando portas...${NC}"
kill_port 9100
kill_port 5001
kill_port 5173

# Função de limpeza ao sair
cleanup() {
    echo -e "\n${YELLOW}Encerrando serviços...${NC}"
    kill_port 9100
    kill_port 5001
    kill_port 5173
    pkill -f "tsx src/index.ts" || true
    pkill -f "vite" || true
    echo -e "${GREEN}✅ Encerramento completo${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Iniciar backend
echo -e "\n${GREEN}Iniciando backend na porta 9100...${NC}"
cd server
npm run dev 2>&1 | tee ../server.log &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
echo -e "${YELLOW}Aguardando backend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:9100/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend está rodando!${NC}"
        break
    fi
    sleep 1
done

# Iniciar frontend
echo -e "\n${GREEN}Iniciando frontend na porta 5001...${NC}"

# Navegar para o diretório do cliente usando o caminho completo
cd "../true label /client"

# Definir variáveis de ambiente para o Vite
export VITE_PORT=5001
export PORT=9100

# Iniciar o Vite
npm run dev 2>&1 | tee "../../true label/client.log" &
FRONTEND_PID=$!

# Voltar ao diretório original
cd "../../true label"

# Aguardar frontend iniciar
echo -e "${YELLOW}Aguardando frontend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend está rodando!${NC}"
        break
    fi
    sleep 1
done

# Informações de acesso
echo -e "\n${GREEN}✨ True Label está rodando!${NC}"
echo -e "\n${YELLOW}URLs de acesso:${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5001${NC}"
echo -e "Backend API: ${GREEN}http://localhost:9100${NC}"
echo -e "API Docs: ${GREEN}http://localhost:9100/api-docs${NC}"
echo -e "\n${YELLOW}Credenciais padrão:${NC}"
echo -e "Email: admin@truelabel.com"
echo -e "Senha: Admin123!@#"

# Abrir no navegador (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open "http://localhost:5001"
fi

echo -e "\n${YELLOW}Pressione Ctrl+C para parar todos os serviços${NC}"
echo -e "${YELLOW}Logs salvos em: server.log e client.log${NC}\n"

# Manter rodando
wait