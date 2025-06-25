#!/bin/bash

# 🏷️ True Label Programming Standards Compliance Checker
# Verifica se o projeto está seguindo os padrões obrigatórios

echo "🏷️  True Label Programming Standards Compliance Check"
echo "=================================================="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

COMPLIANCE_SCORE=0
TOTAL_CHECKS=0

check_compliance() {
    local description="$1"
    local condition="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$condition"; then
        success "$description"
        COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
        return 0
    else
        error "$description"
        return 1
    fi
}

echo ""
info "1. Verificando arquivos obrigatórios..."

check_compliance "Registry de rotas existe" "[ -f 'api-route-registry.json' ]"
check_compliance "Gerenciador de rotas existe" "[ -f 'api-route-manager.js' ]"
check_compliance "Backend gerenciado existe" "[ -f 'server/src/index-managed.js' ]"
check_compliance "Padrões de programação documentados" "[ -f 'TRUE_LABEL_PROGRAMMING_STANDARDS.md' ]"

echo ""
info "2. Verificando estrutura de diretórios..."

check_compliance "Diretório server/src existe" "[ -d 'server/src' ]"
check_compliance "Diretório client/src/services existe" "[ -d 'client/src/services' ]"

echo ""
info "3. Verificando scripts executáveis..."

check_compliance "api-route-manager.js é executável" "[ -x 'api-route-manager.js' ]"
check_compliance "Scripts de setup são executáveis" "[ -x 'setup-route-management.sh' ]"

echo ""
info "4. Verificando configurações..."

# Verificar se o registry tem a estrutura correta
if [ -f "api-route-registry.json" ]; then
    if grep -q '"version"' api-route-registry.json && grep -q '"routes"' api-route-registry.json; then
        success "Registry tem estrutura válida"
        COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
    else
        error "Registry não tem estrutura válida"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

# Verificar se o backend gerenciado segue o padrão
if [ -f "server/src/index-managed.js" ]; then
    if grep -q "API Route Management System" server/src/index-managed.js; then
        success "Backend segue padrão de gerenciamento"
        COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
    else
        error "Backend não segue padrão de gerenciamento"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""
info "5. Verificando funcionalidade..."

# Verificar se Node.js está disponível
if command -v node &> /dev/null; then
    success "Node.js disponível"
    COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
    
    # Testar o gerenciador de rotas
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        if node api-route-manager.js status &> /dev/null; then
            success "Gerenciador de rotas funcional"
            COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
        else
            warning "Gerenciador de rotas com problemas - execute: npm install"
        fi
    else
        warning "Dependências não instaladas - execute: npm install"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))
else
    error "Node.js não disponível"
    warning "Gerenciador de rotas não pode ser testado"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))
fi

echo ""
info "6. Verificando backend atual..."

# Verificar se há processo rodando na porta 3334
if command -v lsof &> /dev/null; then
    if lsof -i :3334 &> /dev/null; then
        success "Backend rodando na porta 3334"
        COMPLIANCE_SCORE=$((COMPLIANCE_SCORE + 1))
    else
        warning "Backend não está rodando"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    warning "Não foi possível verificar se backend está rodando"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""
info "7. Verificando arquivos deprecated..."

if [ -f "server/src/index-ultra-simple.js" ]; then
    warning "Arquivo deprecated encontrado: index-ultra-simple.js"
    echo "   Recomendação: Migrar para index-managed.js"
fi

if [ -f "server/src/index-simple.js" ]; then
    warning "Arquivo deprecated encontrado: index-simple.js"
    echo "   Recomendação: Migrar para index-managed.js"
fi

echo ""
echo "📊 RESULTADO DA CONFORMIDADE"
echo "============================"

COMPLIANCE_PERCENTAGE=$((COMPLIANCE_SCORE * 100 / TOTAL_CHECKS))

echo "Pontuação: $COMPLIANCE_SCORE/$TOTAL_CHECKS ($COMPLIANCE_PERCENTAGE%)"

if [ $COMPLIANCE_PERCENTAGE -ge 90 ]; then
    success "🎉 EXCELENTE CONFORMIDADE ($COMPLIANCE_PERCENTAGE%)"
    echo "   O projeto está seguindo os padrões True Label!"
elif [ $COMPLIANCE_PERCENTAGE -ge 70 ]; then
    warning "⚠️  BOA CONFORMIDADE ($COMPLIANCE_PERCENTAGE%)"
    echo "   Algumas melhorias são necessárias."
elif [ $COMPLIANCE_PERCENTAGE -ge 50 ]; then
    warning "⚠️  CONFORMIDADE MODERADA ($COMPLIANCE_PERCENTAGE%)"
    echo "   Várias melhorias são necessárias."
else
    error "❌ BAIXA CONFORMIDADE ($COMPLIANCE_PERCENTAGE%)"
    echo "   Projeto precisa ser adequado aos padrões!"
fi

echo ""
echo "📋 PRÓXIMOS PASSOS:"

if [ $COMPLIANCE_PERCENTAGE -lt 100 ]; then
    echo "1. Revisar: TRUE_LABEL_PROGRAMMING_STANDARDS.md"
    echo "2. Executar: ./setup-route-management.sh"
    echo "3. Usar: node server/src/index-managed.js"
    echo "4. Validar: node api-route-manager.js validate"
fi

echo ""
echo "📖 Documentação: TRUE_LABEL_PROGRAMMING_STANDARDS.md"
echo "🔧 Ferramentas: node api-route-manager.js help"

# Exit code baseado na conformidade
if [ $COMPLIANCE_PERCENTAGE -ge 70 ]; then
    exit 0
else
    exit 1
fi
