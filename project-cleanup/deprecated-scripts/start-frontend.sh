#!/bin/bash

# Script para iniciar apenas o frontend

echo "🌐 Iniciando Frontend True Label..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Matar processos existentes na porta 5001
if lsof -t -i:5001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Matando processo na porta 5001...${NC}"
    kill -9 $(lsof -t -i:5001) 2>/dev/null || true
    sleep 1
fi

# Navegar para o diretório do cliente
echo -e "${YELLOW}Navegando para o diretório do cliente...${NC}"
cd "../true label /client"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Não foi possível encontrar o diretório do cliente${NC}"
    exit 1
fi

# Definir variáveis de ambiente
export VITE_PORT=5001
export VITE_API_BASE_URL=http://localhost:9100/api/v1

# Iniciar o Vite
echo -e "${GREEN}Iniciando Vite na porta 5001...${NC}"
npm run dev
