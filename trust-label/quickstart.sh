#!/bin/bash

# TRUST LABEL - Quick Start Script
# Este script configura e inicia o sistema completo automaticamente

set -e

echo "╔════════════════════════════════════════════╗"
echo "║       TRUST LABEL - Quick Start v3.0       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar sistema operacional
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${BLUE}🖥  Sistema detectado: ${MACHINE}${NC}"
echo ""

# Função para verificar comando
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 não está instalado${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 está instalado${NC}"
        return 0
    fi
}

# Verificar dependências
echo -e "${YELLOW}📋 Verificando dependências...${NC}"
MISSING_DEPS=0

check_command node || MISSING_DEPS=1
check_command npm || MISSING_DEPS=1

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ Dependências faltando!${NC}"
    echo "Por favor, instale Node.js (https://nodejs.org/)"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Configurando ambiente...${NC}"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo -e "${BLUE}Criando arquivo .env...${NC}"
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustlabel"

# Security
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
BCRYPT_ROUNDS=10

# API Keys (opcional - sistema funciona sem elas)
OPENAI_API_KEY=""
SENDGRID_API_KEY=""

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="trustlabel-uploads"

# Frontend
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Environment
NODE_ENV="development"
PORT=3001
EOF
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Instalando dependências...${NC}"

# Limpar cache do npm para evitar conflitos
npm cache clean --force 2>/dev/null || true

# Instalar dependências
npm install --legacy-peer-deps

echo ""
echo -e "${YELLOW}🗄️  Configurando banco de dados...${NC}"

# Verificar se PostgreSQL está rodando
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo -e "${GREEN}✓ PostgreSQL está rodando${NC}"
        
        # Gerar schema do Prisma
        echo "Gerando schema do banco..."
        npx prisma generate
        
        # Aplicar migrations
        echo "Aplicando migrations..."
        npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss
        
        # Seed do banco
        echo "Populando banco com dados de exemplo..."
        npx prisma db seed 2>/dev/null || true
        
        echo -e "${GREEN}✓ Banco de dados configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL não está rodando${NC}"
        echo "O sistema funcionará com dados mockados"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL não instalado${NC}"
    echo "O sistema funcionará com dados mockados"
fi

echo ""
echo -e "${YELLOW}🏗️  Compilando TypeScript...${NC}"

# Compilar TypeScript
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Falha na compilação${NC}"
    echo "Tentando modo de desenvolvimento..."
else
    echo -e "${GREEN}✓ Build concluído${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Escolha como iniciar o sistema:${NC}"
echo ""
echo "1) Frontend HTML Standalone (recomendado para teste rápido)"
echo "2) Backend Completo + API"
echo "3) Ambos (Frontend + Backend)"
echo ""
read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🌐 Abrindo Frontend Standalone...${NC}"
        
        # Detectar comando para abrir browser
        if [[ "$MACHINE" == "Mac" ]]; then
            open trust-label-complete.html
        elif [[ "$MACHINE" == "Linux" ]]; then
            xdg-open trust-label-complete.html 2>/dev/null || sensible-browser trust-label-complete.html
        else
            echo -e "${YELLOW}Abra manualmente: trust-label-complete.html${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}✅ Frontend aberto no navegador!${NC}"
        echo ""
        echo "📋 Credenciais de acesso:"
        echo "   Admin: admin@trustlabel.com / admin123"
        echo "   Marca: brand@example.com / senha123"
        echo "   Lab: lab@example.com / senha123"
        ;;
        
    2)
        echo ""
        echo -e "${GREEN}🚀 Iniciando Backend...${NC}"
        echo ""
        echo "📡 API disponível em: http://localhost:3001"
        echo "📚 Documentação: http://localhost:3001/api-docs"
        echo ""
        echo "Para parar: Ctrl+C"
        echo ""
        
        if [ -d "dist" ]; then
            npm start
        else
            npm run dev
        fi
        ;;
        
    3)
        echo ""
        echo -e "${GREEN}🚀 Iniciando Sistema Completo...${NC}"
        
        # Iniciar backend em background
        if [ -d "dist" ]; then
            npm start &
        else
            npm run dev &
        fi
        
        BACKEND_PID=$!
        
        # Aguardar backend iniciar
        echo "Aguardando backend iniciar..."
        sleep 5
        
        # Abrir frontend
        if [[ "$MACHINE" == "Mac" ]]; then
            open http://localhost:3001
        elif [[ "$MACHINE" == "Linux" ]]; then
            xdg-open http://localhost:3001 2>/dev/null || sensible-browser http://localhost:3001
        fi
        
        echo ""
        echo -e "${GREEN}✅ Sistema completo iniciado!${NC}"
        echo ""
        echo "📡 Backend: http://localhost:3001"
        echo "🌐 Frontend: http://localhost:3001"
        echo "📚 API Docs: http://localhost:3001/api-docs"
        echo ""
        echo "Para parar: Ctrl+C"
        echo ""
        
        # Manter script rodando
        wait $BACKEND_PID
        ;;
        
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 TRUST LABEL está pronto para uso!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"