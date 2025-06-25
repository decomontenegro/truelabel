#!/bin/bash

# 🧪 Script de Verificação das Correções - True Label
# Este script testa se as correções aplicadas realmente resolveram os problemas

echo "🚀 Iniciando verificação das correções do True Label..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Contador de testes
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    log_info "Executando: $test_name"
    echo "Comando: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        log_success "$test_name - PASSOU"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "$test_name - FALHOU"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo ""
echo "🔍 FASE 1: Verificação de Arquivos de Configuração"
echo "=================================================="

# Teste 1: Verificar se arquivos de configuração existem
run_test "Verificar vercel-build.sh existe e é executável" "[ -x './vercel-build.sh' ]"
run_test "Verificar vercel.json existe" "[ -f './vercel.json' ]"
run_test "Verificar api/index.js existe" "[ -f './api/index.js' ]"

# Teste 2: Verificar conteúdo dos arquivos de configuração
run_test "Verificar se vercel-build.sh contém npm run build" "grep -q 'npm run build' ./vercel-build.sh"
run_test "Verificar se vercel.json tem outputDirectory correto" "grep -q 'client/dist' ./vercel.json"

echo ""
echo "🔧 FASE 2: Verificação de Variáveis de Ambiente"
echo "=================================================="

# Teste 3: Verificar variáveis de ambiente no cliente
if [ -f "client/.env" ]; then
    run_test "Verificar VITE_API_BASE_URL no .env" "grep -q 'VITE_API_BASE_URL' client/.env"
    run_test "Verificar se não há VITE_API_URL incorreto" "! grep -q '^VITE_API_URL=' client/.env"
else
    log_warning "Arquivo client/.env não encontrado - criando exemplo"
    echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > client/.env
    echo "VITE_QR_BASE_URL=http://localhost:3001" >> client/.env
fi

echo ""
echo "📦 FASE 3: Teste de Build Local"
echo "=================================================="

# Teste 4: Build do cliente
cd client
run_test "Instalar dependências do cliente" "npm install --silent"
run_test "Build do cliente" "npm run build"
run_test "Verificar se dist foi criado" "[ -d 'dist' ]"
run_test "Verificar se index.html foi gerado" "[ -f 'dist/index.html' ]"
run_test "Verificar se assets foram gerados" "[ -d 'dist/assets' ]"

# Teste 5: Verificar conteúdo do build
if [ -f "dist/index.html" ]; then
    run_test "Verificar se index.html contém scripts" "grep -q '<script' dist/index.html"
    run_test "Verificar se index.html contém CSS" "grep -q 'stylesheet' dist/index.html"
fi

cd ..

echo ""
echo "🔗 FASE 4: Teste de Conectividade da API"
echo "=================================================="

# Teste 6: Verificar se o servidor pode ser iniciado
cd server
if [ -f "package.json" ]; then
    run_test "Instalar dependências do servidor" "npm install --silent"
    
    # Verificar se o banco de dados existe
    if [ ! -f "prisma/dev.db" ]; then
        log_info "Criando banco de dados de teste..."
        npm run migrate > /dev/null 2>&1
        npm run seed > /dev/null 2>&1
    fi
    
    # Testar se o servidor pode iniciar (timeout de 10 segundos)
    log_info "Testando inicialização do servidor (timeout 10s)..."
    timeout 10s npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 3
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Servidor iniciou com sucesso"
        kill $SERVER_PID 2>/dev/null
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "Servidor falhou ao iniciar"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

cd ..

echo ""
echo "🎯 FASE 5: Testes Específicos Disponíveis"
echo "=================================================="

# Teste 7: Executar testes específicos se disponíveis
if [ -f "client/test-auth-flow.html" ]; then
    log_info "Teste de autenticação disponível em: client/test-auth-flow.html"
fi

if [ -f "client/test-qr-flow.html" ]; then
    log_info "Teste de QR codes disponível em: client/test-qr-flow.html"
fi

if [ -f "client/test-api-login.js" ]; then
    run_test "Executar teste de login da API" "cd client && node test-api-login.js"
fi

echo ""
echo "📊 FASE 6: Teste de Preview de Produção"
echo "=================================================="

# Teste 8: Preview de produção
cd client
if [ -d "dist" ]; then
    log_info "Iniciando preview de produção (timeout 5s)..."
    timeout 5s npm run preview > /dev/null 2>&1 &
    PREVIEW_PID=$!
    sleep 2
    
    if kill -0 $PREVIEW_PID 2>/dev/null; then
        log_success "Preview de produção funcionando"
        kill $PREVIEW_PID 2>/dev/null
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "Preview de produção falhou"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

cd ..

echo ""
echo "📋 RESUMO DOS TESTES"
echo "=================================================="
echo "Total de testes executados: $TOTAL_TESTS"
log_success "Testes que passaram: $TESTS_PASSED"
log_error "Testes que falharam: $TESTS_FAILED"

# Calcular porcentagem de sucesso
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo "Taxa de sucesso: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 80 ]; then
        echo ""
        log_success "🎉 CORREÇÕES VERIFICADAS COM SUCESSO!"
        log_success "As correções aplicadas resolveram a maioria dos problemas."
        echo ""
        echo "✅ Próximos passos recomendados:"
        echo "1. Fazer deploy no Vercel com as configurações atualizadas"
        echo "2. Configurar variáveis de ambiente de produção"
        echo "3. Testar a aplicação em produção"
    else
        echo ""
        log_warning "⚠️  ALGUMAS CORREÇÕES PRECISAM DE ATENÇÃO"
        log_warning "Alguns testes falharam. Verifique os logs acima."
        echo ""
        echo "🔧 Ações recomendadas:"
        echo "1. Revisar os testes que falharam"
        echo "2. Verificar configurações de ambiente"
        echo "3. Executar testes individuais para diagnóstico"
    fi
else
    log_error "Nenhum teste foi executado"
fi

echo ""
echo "📖 Para mais informações, consulte:"
echo "- VERCEL-WHITE-SCREEN-FIX.md"
echo "- QR-SYSTEM-FINAL-REPORT.md"
echo "- DEPLOYMENT-GUIDE.md"
echo ""
