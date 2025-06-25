#!/bin/bash

# 🔍 True Label - Script de Verificação do Sistema
# Verifica se o sistema está funcionando corretamente

echo "🔍 Verificando sistema True Label..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# Função para verificar se porta está em uso
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

echo "📋 Verificando pré-requisitos..."

# 1. Verificar Node.js
node --version > /dev/null 2>&1
check_status "Node.js instalado"

# 2. Verificar npm
npm --version > /dev/null 2>&1
check_status "npm instalado"

# 3. Verificar estrutura de arquivos essenciais
echo "📁 Verificando estrutura de arquivos..."

ESSENTIAL_FILES=(
    "package.json"
    "client/package.json"
    "server/package.json"
    "client/src/main.tsx"
    "server/src/index-managed.js"
    "vercel.json"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
    fi
done

# 4. Verificar dependências
echo "📦 Verificando dependências..."

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependências principais instaladas${NC}"
else
    echo -e "${YELLOW}⚠️ Instalando dependências principais...${NC}"
    npm install
    check_status "Dependências principais instaladas"
fi

if [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✅ Dependências do cliente instaladas${NC}"
else
    echo -e "${YELLOW}⚠️ Instalando dependências do cliente...${NC}"
    cd client && npm install && cd ..
    check_status "Dependências do cliente instaladas"
fi

if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✅ Dependências do servidor instaladas${NC}"
else
    echo -e "${YELLOW}⚠️ Instalando dependências do servidor...${NC}"
    cd server && npm install && cd ..
    check_status "Dependências do servidor instaladas"
fi

# 5. Verificar configurações
echo "⚙️ Verificando configurações..."

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example encontrado${NC}"
else
    echo -e "${RED}❌ .env.example não encontrado${NC}"
fi

if [ -f "client/.env.example" ]; then
    echo -e "${GREEN}✅ client/.env.example encontrado${NC}"
else
    echo -e "${RED}❌ client/.env.example não encontrado${NC}"
fi

if [ -f "server/.env.example" ]; then
    echo -e "${GREEN}✅ server/.env.example encontrado${NC}"
else
    echo -e "${RED}❌ server/.env.example não encontrado${NC}"
fi

# 6. Verificar se portas estão livres
echo "🔌 Verificando portas..."

if check_port 3334; then
    echo -e "${YELLOW}⚠️ Porta 3334 (backend) em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 3334 (backend) livre${NC}"
fi

if check_port 9103; then
    echo -e "${YELLOW}⚠️ Porta 9103 (frontend) em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 9103 (frontend) livre${NC}"
fi

# 7. Teste de build
echo "🔨 Testando build do frontend..."
cd client
npm run build > /dev/null 2>&1
if check_status "Build do frontend"; then
    echo -e "${GREEN}✅ Frontend pode ser buildado${NC}"
else
    echo -e "${RED}❌ Erro no build do frontend${NC}"
fi
cd ..

# 8. Verificar Git
echo "📝 Verificando Git..."
git status > /dev/null 2>&1
check_status "Repositório Git válido"

# 9. Verificar deploy
echo "🚀 Verificando configuração de deploy..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ Configuração Vercel encontrada${NC}"
else
    echo -e "${RED}❌ Configuração Vercel não encontrada${NC}"
fi

# 10. Resumo final
echo ""
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "========================"

if [ -f "package.json" ] && [ -f "client/src/main.tsx" ] && [ -f "server/src/index-managed.js" ]; then
    echo -e "${GREEN}✅ SISTEMA PRONTO PARA USO${NC}"
    echo ""
    echo "🚀 Para iniciar o sistema:"
    echo "   npm run dev"
    echo ""
    echo "🌐 URLs de acesso:"
    echo "   Frontend: http://localhost:9103"
    echo "   Backend:  http://localhost:3334"
    echo ""
    echo "📋 Deploy atual:"
    echo "   https://truelabel2-11z22qdif-decos-projects-925dd01d.vercel.app"
else
    echo -e "${RED}❌ SISTEMA COM PROBLEMAS${NC}"
    echo "Verifique os erros acima antes de continuar"
fi

echo ""
echo "📚 Documentação:"
echo "   docs/development/MAPA-DE-PROCESSOS-TRUELABEL.md"
echo "   docs/deployment/VERSION-STABLE-v1.0.0.md"
