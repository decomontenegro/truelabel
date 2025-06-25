#!/bin/bash

# 🚀 Teste Rápido das Correções - True Label
# Script simplificado para verificar rapidamente se as correções funcionaram

echo "🧪 Teste Rápido das Correções do True Label"
echo "==========================================="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para log
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo ""
echo "1️⃣ Verificando arquivos de configuração..."

# Verificar arquivos essenciais
if [ -f "vercel-build.sh" ] && [ -x "vercel-build.sh" ]; then
    success "vercel-build.sh existe e é executável"
else
    error "vercel-build.sh não encontrado ou não é executável"
fi

if [ -f "vercel.json" ]; then
    success "vercel.json existe"
    if grep -q "client/dist" vercel.json; then
        success "vercel.json configurado corretamente para client/dist"
    else
        warning "vercel.json pode não estar configurado corretamente"
    fi
else
    error "vercel.json não encontrado"
fi

if [ -f "api/index.js" ]; then
    success "api/index.js existe"
else
    error "api/index.js não encontrado"
fi

echo ""
echo "2️⃣ Verificando variáveis de ambiente..."

if [ -f "client/.env" ]; then
    if grep -q "VITE_API_BASE_URL" client/.env; then
        success "VITE_API_BASE_URL encontrado no .env"
    else
        error "VITE_API_BASE_URL não encontrado no .env"
    fi
    
    if grep -q "^VITE_API_URL=" client/.env; then
        warning "VITE_API_URL incorreto ainda presente no .env"
    else
        success "Variável VITE_API_URL incorreta não encontrada"
    fi
else
    warning "client/.env não encontrado"
fi

echo ""
echo "3️⃣ Testando build local..."

cd client

if [ -f "package.json" ]; then
    echo "Instalando dependências..."
    npm install --silent
    
    echo "Executando build..."
    if npm run build > build.log 2>&1; then
        success "Build executado com sucesso"
        
        if [ -d "dist" ]; then
            success "Pasta dist criada"
            
            if [ -f "dist/index.html" ]; then
                success "index.html gerado"
            else
                error "index.html não encontrado em dist/"
            fi
            
            if [ -d "dist/assets" ]; then
                success "Assets gerados"
            else
                warning "Pasta assets não encontrada"
            fi
        else
            error "Pasta dist não foi criada"
        fi
    else
        error "Build falhou - verifique build.log"
        echo "Últimas linhas do log de build:"
        tail -10 build.log
    fi
else
    error "package.json não encontrado no cliente"
fi

cd ..

echo ""
echo "4️⃣ Verificando testes específicos disponíveis..."

# Listar testes disponíveis
if [ -f "client/test-auth-flow.html" ]; then
    success "Teste de autenticação disponível"
    echo "   📄 Abra: client/test-auth-flow.html"
fi

if [ -f "client/test-qr-flow.html" ]; then
    success "Teste de QR codes disponível"
    echo "   📄 Abra: client/test-qr-flow.html"
fi

if [ -f "client/test-api-login.js" ]; then
    success "Teste de API disponível"
    echo "   🔧 Execute: cd client && node test-api-login.js"
fi

echo ""
echo "5️⃣ Teste de preview de produção..."

cd client
if [ -d "dist" ]; then
    echo "Iniciando preview (será interrompido em 3 segundos)..."
    timeout 3s npm run preview > preview.log 2>&1 &
    PREVIEW_PID=$!
    sleep 2
    
    if kill -0 $PREVIEW_PID 2>/dev/null; then
        success "Preview funcionando - aplicação acessível"
        kill $PREVIEW_PID 2>/dev/null
        echo "   🌐 Normalmente disponível em: http://localhost:4173"
    else
        error "Preview falhou - verifique preview.log"
    fi
else
    warning "Pasta dist não existe - execute o build primeiro"
fi

cd ..

echo ""
echo "📊 RESUMO"
echo "========="
echo ""
echo "✅ Para testar completamente, execute:"
echo "   ./test-corrections-verification.sh"
echo ""
echo "🌐 Para testar manualmente:"
echo "   1. cd client && npm run build && npm run preview"
echo "   2. Abra http://localhost:4173"
echo "   3. Teste login e funcionalidades"
echo ""
echo "🚀 Para deploy no Vercel:"
echo "   1. Configure as variáveis de ambiente no dashboard"
echo "   2. Faça push para o repositório"
echo "   3. Verifique os logs de build"
echo ""
echo "📖 Documentação:"
echo "   - VERCEL-WHITE-SCREEN-FIX.md"
echo "   - DEPLOYMENT-GUIDE.md"
echo ""
