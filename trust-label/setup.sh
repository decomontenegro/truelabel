#!/bin/bash

echo "🚀 TRUST LABEL - Setup Completo v3.0"
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar comando
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 não está instalado${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 instalado${NC}"
        return 0
    fi
}

# Função para verificar serviço
check_service() {
    if nc -z localhost $2 2>/dev/null; then
        echo -e "${GREEN}✓ $1 rodando na porta $2${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ $1 não está rodando na porta $2${NC}"
        return 1
    fi
}

echo -e "\n${YELLOW}1. Verificando dependências...${NC}"
echo "------------------------------"

# Verificar Node.js
if check_command node; then
    echo "   Versão: $(node --version)"
else
    echo -e "${RED}Por favor, instale o Node.js 18+${NC}"
    exit 1
fi

# Verificar npm
if check_command npm; then
    echo "   Versão: $(npm --version)"
fi

# Verificar Docker
if check_command docker; then
    echo "   Versão: $(docker --version)"
else
    echo -e "${YELLOW}Docker não instalado. Você precisará instalar PostgreSQL e Redis manualmente.${NC}"
fi

# Verificar Docker Compose
if check_command docker-compose; then
    echo "   Versão: $(docker-compose --version)"
fi

echo -e "\n${YELLOW}2. Configurando ambiente...${NC}"
echo "---------------------------"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}Criando arquivo .env...${NC}"
    cp .env.example .env 2>/dev/null || cat > .env << 'EOL'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustlabel"

# API Keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# JWT
JWT_SECRET="$(openssl rand -base64 32 || echo 'default-secret-change-this')"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Email
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@trustlabel.com"

# Redis
REDIS_URL="redis://localhost:6379"
EOL
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

echo -e "\n${YELLOW}3. Instalando dependências...${NC}"
echo "-----------------------------"
npm install

echo -e "\n${YELLOW}4. Iniciando serviços Docker...${NC}"
echo "-------------------------------"

if command -v docker-compose &> /dev/null; then
    echo "Iniciando PostgreSQL e Redis..."
    docker-compose up -d postgres redis
    
    # Aguardar serviços iniciarem
    echo "Aguardando serviços..."
    sleep 5
    
    # Verificar serviços
    check_service "PostgreSQL" 5432
    check_service "Redis" 6379
else
    echo -e "${YELLOW}Docker Compose não encontrado. Certifique-se de ter PostgreSQL e Redis rodando.${NC}"
fi

echo -e "\n${YELLOW}5. Configurando banco de dados...${NC}"
echo "---------------------------------"

# Gerar Prisma Client
echo "Gerando Prisma Client..."
npx prisma generate

# Executar migrações
echo "Executando migrações..."
npx prisma db push

echo -e "\n${YELLOW}6. Criando diretórios necessários...${NC}"
echo "------------------------------------"
mkdir -p uploads/products
mkdir -p uploads/reports
mkdir -p logs
echo -e "${GREEN}✓ Diretórios criados${NC}"

echo -e "\n${YELLOW}7. Compilando TypeScript...${NC}"
echo "---------------------------"
npm run build 2>/dev/null || npx tsc

echo -e "\n${GREEN}🎉 Setup concluído com sucesso!${NC}"
echo "================================"
echo ""
echo "Para iniciar o servidor em modo de desenvolvimento:"
echo -e "${YELLOW}npm run dev${NC}"
echo ""
echo "Para iniciar o servidor em produção:"
echo -e "${YELLOW}npm start${NC}"
echo ""
echo "Serviços disponíveis:"
echo " 🌐 API: http://localhost:3001"
echo " 🗄 PostgreSQL: localhost:5432"
echo " 🔴 Redis: localhost:6379"
if command -v docker-compose &> /dev/null; then
    echo " 🛠 pgAdmin: http://localhost:5050 (admin@trustlabel.com / admin123)"
    echo " 🛠 Redis Commander: http://localhost:8081"
fi
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} Configure as chaves de API no arquivo .env antes de usar!"
echo ""