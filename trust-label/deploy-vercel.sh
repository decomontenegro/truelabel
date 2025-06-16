#!/bin/bash

echo "🚀 TRUST LABEL - Deploy para Vercel"
echo "===================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI não está instalado${NC}"
    echo "Instale com: npm i -g vercel"
    exit 1
fi

echo -e "${YELLOW}1. Preparando build...${NC}"

# Compilar TypeScript
echo "Compilando TypeScript..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Falha ao compilar${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído${NC}"

echo -e "\n${YELLOW}2. Configurando variáveis de ambiente...${NC}"
echo "As seguintes variáveis precisam ser configuradas no Vercel:"
echo " - DATABASE_URL"
echo " - JWT_SECRET"
echo " - OPENAI_API_KEY"
echo " - SENDGRID_API_KEY"
echo " - REDIS_URL"
echo " - AWS_ACCESS_KEY_ID"
echo " - AWS_SECRET_ACCESS_KEY"
echo " - AWS_REGION"
echo " - AWS_S3_BUCKET"

echo -e "\n${YELLOW}3. Iniciando deploy...${NC}"

# Deploy
vercel --prod

echo -e "\n${GREEN}🎉 Deploy concluído!${NC}"
echo "Verifique o URL fornecido pela Vercel"