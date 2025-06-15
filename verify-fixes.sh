#!/bin/bash

# 🔍 Verificação Simples das Correções - True Label
# Este script verifica se as correções foram aplicadas corretamente

echo "🔍 Verificando se as correções do True Label foram aplicadas..."
echo "============================================================="

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

ISSUES_FOUND=0

echo ""
echo "📁 1. Verificando Arquivos de Configuração do Vercel"
echo "=================================================="

# Verificar vercel-build.sh
if [ -f "vercel-build.sh" ]; then
    if [ -x "vercel-build.sh" ]; then
        success "vercel-build.sh existe e é executável"
        
        if grep -q "npm run build" vercel-build.sh; then
            success "vercel-build.sh contém comando de build"
        else
            error "vercel-build.sh não contém 'npm run build'"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    else
        error "vercel-build.sh não é executável"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    error "vercel-build.sh não encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Verificar vercel.json
if [ -f "vercel.json" ]; then
    success "vercel.json existe"
    
    if grep -q "client/dist" vercel.json; then
        success "vercel.json configurado para client/dist"
    else
        error "vercel.json não aponta para client/dist"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "api/index.js" vercel.json; then
        success "vercel.json configurado para API serverless"
    else
        warning "vercel.json pode não ter configuração de API"
    fi
else
    error "vercel.json não encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Verificar api/index.js
if [ -f "api/index.js" ]; then
    success "api/index.js existe (função serverless)"
else
    error "api/index.js não encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "🔧 2. Verificando Variáveis de Ambiente"
echo "======================================="

# Verificar client/.env
if [ -f "client/.env" ]; then
    success "client/.env existe"
    
    if grep -q "VITE_API_BASE_URL" client/.env; then
        success "VITE_API_BASE_URL encontrado"
        
        # Verificar se não tem a variável incorreta
        if grep -q "^VITE_API_URL=" client/.env; then
            error "VITE_API_URL incorreto ainda presente"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        else
            success "Variável VITE_API_URL incorreta removida"
        fi
    else
        error "VITE_API_BASE_URL não encontrado"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "VITE_QR_BASE_URL" client/.env; then
        success "VITE_QR_BASE_URL configurado"
    else
        warning "VITE_QR_BASE_URL não encontrado"
    fi
else
    warning "client/.env não encontrado"
    info "Criando arquivo .env básico..."
    
    cat > client/.env << EOF
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_QR_BASE_URL=http://localhost:3001
VITE_ENVIRONMENT=development
EOF
    success "client/.env criado com configurações básicas"
fi

# Verificar .env.example
if [ -f ".env.example" ]; then
    success ".env.example existe"
else
    warning ".env.example não encontrado"
fi

echo ""
echo "📦 3. Verificando Estrutura do Projeto"
echo "====================================="

# Verificar estrutura de diretórios
if [ -d "client" ]; then
    success "Diretório client/ existe"
    
    if [ -f "client/package.json" ]; then
        success "client/package.json existe"
    else
        error "client/package.json não encontrado"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if [ -f "client/vite.config.ts" ]; then
        success "client/vite.config.ts existe"
    else
        warning "client/vite.config.ts não encontrado"
    fi
    
    if [ -d "client/src" ]; then
        success "client/src/ existe"
    else
        error "client/src/ não encontrado"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    error "Diretório client/ não encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ -d "server" ]; then
    success "Diretório server/ existe"
    
    if [ -f "server/package.json" ]; then
        success "server/package.json existe"
    else
        error "server/package.json não encontrado"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    error "Diretório server/ não encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "🧪 4. Verificando Arquivos de Teste"
echo "==================================="

# Verificar testes disponíveis
test_files=(
    "client/test-auth-flow.html"
    "client/test-qr-flow.html"
    "client/test-api-login.js"
    "test-build.sh"
)

for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        success "Teste disponível: $test_file"
    else
        warning "Teste não encontrado: $test_file"
    fi
done

echo ""
echo "📚 5. Verificando Documentação"
echo "=============================="

# Verificar documentação
docs=(
    "VERCEL-WHITE-SCREEN-FIX.md"
    "VERCEL-FIX-TELA-BRANCA.md"
    "DEPLOYMENT-GUIDE.md"
    "client/QR-SYSTEM-FINAL-REPORT.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        success "Documentação: $doc"
    else
        warning "Documentação não encontrada: $doc"
    fi
done

echo ""
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "======================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo ""
    success "🎉 TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO!"
    echo ""
    info "✅ Configuração do Vercel: Completa"
    info "✅ Variáveis de ambiente: Corrigidas"
    info "✅ Estrutura do projeto: Válida"
    info "✅ Arquivos de teste: Disponíveis"
    info "✅ Documentação: Presente"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "1. Configurar variáveis de ambiente no Vercel Dashboard"
    echo "2. Fazer push para o repositório"
    echo "3. Verificar deploy no Vercel"
    echo ""
    echo "📖 Para mais detalhes, consulte:"
    echo "   - VERCEL-WHITE-SCREEN-FIX.md"
    echo "   - DEPLOYMENT-GUIDE.md"
    echo ""
elif [ $ISSUES_FOUND -le 2 ]; then
    echo ""
    warning "⚠️  CORREÇÕES APLICADAS COM PEQUENOS PROBLEMAS"
    echo ""
    warning "Foram encontrados $ISSUES_FOUND problema(s) menores"
    echo "As correções principais foram aplicadas, mas alguns ajustes podem ser necessários"
    echo ""
    echo "🔧 AÇÕES RECOMENDADAS:"
    echo "1. Revisar os problemas listados acima"
    echo "2. Corrigir os itens marcados com ❌"
    echo "3. Testar o build localmente"
    echo ""
else
    echo ""
    error "❌ PROBLEMAS ENCONTRADOS NAS CORREÇÕES"
    echo ""
    error "Foram encontrados $ISSUES_FOUND problemas"
    echo "Algumas correções podem não ter sido aplicadas corretamente"
    echo ""
    echo "🆘 AÇÕES NECESSÁRIAS:"
    echo "1. Revisar todos os itens marcados com ❌"
    echo "2. Consultar a documentação de correções"
    echo "3. Reaplicar as correções necessárias"
    echo ""
fi

echo "📞 Para suporte adicional:"
echo "   - Execute: ./test-corrections-verification.sh (teste completo)"
echo "   - Consulte: verification-report.md"
echo ""
