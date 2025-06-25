#!/bin/bash

# 🚀 True Label - Script de Inicialização Final
# Versão: 2.0
# Data: 2025-06-15

echo "🏷️  Iniciando True Label - Versão Final"
echo "======================================"

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

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para encontrar porta livre
find_free_port() {
    local start_port=$1
    local port=$start_port
    
    while check_port $port; do
        port=$((port + 1))
        if [ $port -gt $((start_port + 10)) ]; then
            error "Não foi possível encontrar porta livre entre $start_port e $((start_port + 10))"
            exit 1
        fi
    done
    
    echo $port
}

echo ""
info "1. Verificando ambiente..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    echo "Instale Node.js em: https://nodejs.org"
    exit 1
fi

success "Node.js $(node --version) encontrado"

# Verificar diretórios
if [ ! -d "/Users/andremontenegro/true label /server" ]; then
    error "Diretório do servidor não encontrado!"
    exit 1
fi

if [ ! -d "/Users/andremontenegro/true label /client" ]; then
    error "Diretório do cliente não encontrado!"
    exit 1
fi

success "Diretórios do projeto encontrados"

echo ""
info "2. Configurando Backend..."

cd "/Users/andremontenegro/true label /server"

# Verificar se arquivo backend existe
if [ ! -f "src/index-simple.js" ]; then
    error "Arquivo backend simplificado não encontrado!"
    echo "Execute primeiro a configuração completa do projeto."
    exit 1
fi

# Encontrar porta livre para backend
BACKEND_PORT=$(find_free_port 3333)
success "Porta livre encontrada para backend: $BACKEND_PORT"

# Verificar dependências
if [ ! -d "node_modules" ]; then
    info "Instalando dependências do backend..."
    npm install
fi

echo ""
info "3. Configurando Frontend..."

cd "/Users/andremontenegro/true label /client"

# Atualizar configuração do frontend
cat > .env << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
VITE_QR_BASE_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME="CPG Validation Platform"
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Features
VITE_FEATURE_QR_CODES=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_FILE_UPLOAD=true
EOF

success "Configuração do frontend atualizada para porta $BACKEND_PORT"

# Verificar dependências
if [ ! -d "node_modules" ]; then
    info "Instalando dependências do frontend..."
    npm install
fi

echo ""
info "4. Iniciando serviços..."

# Matar processos existentes
pkill -f "index-simple" > /dev/null 2>&1
pkill -f "vite.*3001" > /dev/null 2>&1

# Iniciar backend em background
cd "/Users/andremontenegro/true label /server"
info "Iniciando backend na porta $BACKEND_PORT..."

PORT=$BACKEND_PORT node src/index-simple.js > backend.log 2>&1 &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 3

# Verificar se backend iniciou
if ! check_port $BACKEND_PORT; then
    error "Falha ao iniciar backend!"
    echo "Verifique o log: tail -f backend.log"
    exit 1
fi

success "Backend iniciado (PID: $BACKEND_PID)"

# Iniciar frontend
cd "/Users/andremontenegro/true label /client"
info "Iniciando frontend na porta 3001..."

npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Aguardar frontend inicializar
sleep 5

# Verificar se frontend iniciou
if ! check_port 3001; then
    error "Falha ao iniciar frontend!"
    echo "Verifique o log: tail -f frontend.log"
    kill $BACKEND_PID > /dev/null 2>&1
    exit 1
fi

success "Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
info "5. Testando conexões..."

# Testar backend
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    success "Backend respondendo corretamente"
else
    warning "Backend pode não estar respondendo corretamente"
fi

echo ""
success "🎉 True Label iniciado com sucesso!"
echo ""
echo "📱 URLs de acesso:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   Health:   http://localhost:$BACKEND_PORT/health"
echo ""
echo "👥 Credenciais de teste:"
echo "   Admin: admin@truelabel.com / admin123"
echo "   Brand: marca@exemplo.com / marca123"
echo "   Lab: analista@labexemplo.com / lab123"
echo ""
echo "📋 Processos rodando:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🔧 Para parar os serviços:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 Para monitorar logs:"
echo "   Backend:  tail -f /Users/andremontenegro/true\\ label\\ /server/backend.log"
echo "   Frontend: tail -f /Users/andremontenegro/true\\ label\\ /client/frontend.log"
echo ""
echo "📖 Documentação completa: PROJETO_TRUE_LABEL_DOCUMENTACAO_COMPLETA.md"
echo ""

# Salvar informações da sessão
cat > "/Users/andremontenegro/true label/session.info" << EOF
# True Label Session Info
# Generated: $(date)
BACKEND_PORT=$BACKEND_PORT
BACKEND_PID=$BACKEND_PID
FRONTEND_PID=$FRONTEND_PID
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:$BACKEND_PORT
EOF

success "Informações da sessão salvas em session.info"
echo ""
warning "Mantenha este terminal aberto ou anote os PIDs para parar os serviços depois!"
echo ""
info "🚀 Acesse http://localhost:3001 para usar o True Label!"
