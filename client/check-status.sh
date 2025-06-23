#!/bin/bash

echo "🔍 Verificando status do True Label..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend
echo "Backend (porta 3000):"
if lsof -i :3000 | grep LISTEN > /dev/null; then
    echo -e "${GREEN}✓ Backend está rodando${NC}"
    # Test health endpoint
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend está respondendo${NC}"
    else
        echo -e "${YELLOW}⚠ Backend rodando mas não respondendo${NC}"
    fi
else
    echo -e "${RED}✗ Backend não está rodando${NC}"
    echo "  Execute: cd ../server && npm run dev"
fi

echo ""

# Check frontend
echo "Frontend (porta 3001):"
if lsof -i :3001 | grep LISTEN > /dev/null; then
    echo -e "${GREEN}✓ Frontend está rodando${NC}"
    # Test if frontend responds
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend está respondendo${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend rodando mas não respondendo${NC}"
    fi
else
    echo -e "${RED}✗ Frontend não está rodando${NC}"
    echo "  Execute: npm run dev"
fi

echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:3000/api"
echo "  Teste:    http://localhost:3001/test-connection"
echo ""
echo "Credenciais:"
echo "  admin@truelabel.com / admin123"