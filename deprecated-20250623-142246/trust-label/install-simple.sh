#!/bin/bash

echo "🚀 Instalação simplificada do TRUST Label"
echo "========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Instalar dependências do web app diretamente
echo -e "${YELLOW}Instalando dependências do Web App...${NC}"
cd apps/web
npm install --legacy-peer-deps || echo "Aviso: Algumas dependências podem ter falhado"

# Voltar para raiz
cd ../..

echo -e "${GREEN}✅ Instalação básica concluída!${NC}"
echo ""
echo "Para executar o projeto:"
echo "1. Abra um terminal e execute:"
echo "   cd apps/web && npm run dev"
echo ""
echo "2. Em outro terminal, execute a API:"
echo "   cd apps/api && npm run dev"
echo ""
echo "Ou use a versão HTML standalone já disponível:"
echo "http://localhost:8001/trust-label-interactive.html"