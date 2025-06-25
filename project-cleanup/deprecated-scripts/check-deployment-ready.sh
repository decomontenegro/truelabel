#!/bin/bash

# True Label - Deployment Readiness Check
# This script checks if everything is ready for deployment

echo "🔍 True Label - Verificação de Prontidão para Deploy"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Check function
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAILED++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# 1. Check essential files
echo "📁 Verificando arquivos essenciais..."
if [ -f "vercel.json" ]; then
    check 0 "vercel.json encontrado"
else
    check 1 "vercel.json não encontrado"
fi
[ -f "vercel-build.sh" ] && check 0 "vercel-build.sh encontrado" || check 1 "vercel-build.sh não encontrado"
[ -f "package.json" ] && check 0 "package.json encontrado" || check 1 "package.json não encontrado"
[ -f "server/package.json" ] && check 0 "server/package.json encontrado" || check 1 "server/package.json não encontrado"
[ -f "client/package.json" ] && check 0 "client/package.json encontrado" || check 1 "client/package.json não encontrado"
echo ""

# 2. Check Node.js version
echo "🟢 Verificando Node.js..."
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -ge 16 ]; then
    check 0 "Node.js versão $(node -v)"
else
    check 1 "Node.js versão incompatível (precisa 16+)"
fi
echo ""

# 3. Check Git status
echo "📝 Verificando Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    check 0 "Repositório Git encontrado"
    
    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check 0 "Sem alterações não commitadas"
    else
        warn "Existem alterações não commitadas"
        git status --short
    fi
    
    # Check remote
    if git remote get-url origin > /dev/null 2>&1; then
        check 0 "Remote origin configurado: $(git remote get-url origin)"
    else
        check 1 "Remote origin não configurado"
    fi
else
    check 1 "Não é um repositório Git"
fi
echo ""

# 4. Check environment files
echo "🔐 Verificando arquivos de ambiente..."
if [ -f "server/.env" ]; then
    warn "server/.env existe (será ignorado no deploy)"
else
    check 0 "server/.env não existe (bom para deploy)"
fi

if [ -f "client/.env" ]; then
    warn "client/.env existe (será ignorado no deploy)"
else
    check 0 "client/.env não existe (bom para deploy)"
fi

[ -f ".env.example" ] && check 0 ".env.example encontrado" || warn ".env.example não encontrado"
echo ""

# 5. Check build
echo "🏗️  Verificando build..."
if [ -x "vercel-build.sh" ]; then
    check 0 "vercel-build.sh é executável"
else
    check 1 "vercel-build.sh não é executável (execute: chmod +x vercel-build.sh)"
fi

# Try test build
echo "Testando build do cliente..."
cd client
if npm run build > /dev/null 2>&1; then
    check 0 "Build do cliente funcionou"
    rm -rf dist
else
    check 1 "Build do cliente falhou"
fi
cd ..

# Check TypeScript
echo "Verificando TypeScript..."
cd server
if npx tsc --noEmit > /dev/null 2>&1; then
    check 0 "TypeScript sem erros"
else
    warn "TypeScript com erros (pode funcionar mesmo assim)"
fi
cd ..
echo ""

# 6. Check Prisma
echo "🗄️  Verificando Prisma..."
if [ -f "server/prisma/schema.prisma" ]; then
    check 0 "Schema Prisma encontrado"
    
    # Check if SQLite is being used
    if grep -q "provider = \"sqlite\"" server/prisma/schema.prisma; then
        warn "Usando SQLite - mude para PostgreSQL em produção!"
    else
        check 0 "Não está usando SQLite"
    fi
else
    check 1 "Schema Prisma não encontrado"
fi
echo ""

# 7. Check dependencies
echo "📦 Verificando dependências..."
cd server
if [ -d "node_modules" ]; then
    check 0 "Dependências do servidor instaladas"
else
    warn "Dependências do servidor não instaladas (normal para deploy)"
fi
cd ..

cd client
if [ -d "node_modules" ]; then
    check 0 "Dependências do cliente instaladas"
else
    warn "Dependências do cliente não instaladas (normal para deploy)"
fi
cd ..
echo ""

# 8. Environment variables check
echo "🔑 Variáveis de ambiente necessárias:"
echo "Certifique-se de configurar no Vercel:"
echo ""
echo "Backend:"
echo "  - DATABASE_URL (PostgreSQL)"
echo "  - JWT_SECRET (32+ caracteres)"
echo "  - NODE_ENV=production"
echo ""
echo "Frontend:"
echo "  - VITE_API_BASE_URL"
echo "  - VITE_QR_BASE_URL"
echo "  - VITE_ENVIRONMENT=production"
echo ""
echo "Email (opcional):"
echo "  - EMAIL_ENABLED"
echo "  - EMAIL_PROVIDER"
echo "  - SENDGRID_API_KEY (se usar SendGrid)"
echo ""
echo "Redis (opcional):"
echo "  - REDIS_ENABLED"
echo "  - REDIS_URL"
echo ""

# Summary
echo "===================================================="
echo "📊 Resumo:"
echo -e "${GREEN}✅ Passou: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo -e "${RED}❌ Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Pronto para deploy!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure PostgreSQL (siga SETUP-POSTGRESQL.md)"
    echo "2. Configure Email (siga SETUP-EMAIL.md)"
    echo "3. Configure Redis (siga SETUP-REDIS.md)"
    echo "4. Faça deploy (siga DEPLOY-VERCEL.md)"
else
    echo -e "${RED}❌ Corrija os erros antes do deploy${NC}"
fi