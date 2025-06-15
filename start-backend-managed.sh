#!/bin/bash

# 🏷️ True Label - Iniciar Backend Gerenciado
# Script simplificado para iniciar o backend seguindo os padrões

echo "🏷️  True Label - Backend Gerenciado"
echo "================================="

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

echo ""
info "1. Verificando ambiente..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    echo "Instale Node.js em: https://nodejs.org"
    exit 1
fi

success "Node.js $(node --version) encontrado"

# Verificar se arquivo backend existe
if [ ! -f "server/src/index-managed.js" ]; then
    error "Backend gerenciado não encontrado!"
    echo "Arquivo esperado: server/src/index-managed.js"
    exit 1
fi

success "Backend gerenciado encontrado"

echo ""
info "2. Preparando ambiente..."

# Parar qualquer processo na porta 3334
echo "🔧 Liberando porta 3334..."
PID=$(lsof -ti :3334 2>/dev/null)
if [ ! -z "$PID" ]; then
    kill $PID
    success "Processo anterior finalizado (PID: $PID)"
    sleep 2
else
    success "Porta 3334 já está livre"
fi

# Verificar se diretório server existe
if [ ! -d "server" ]; then
    error "Diretório server não encontrado!"
    exit 1
fi

echo ""
info "3. Iniciando backend gerenciado..."

# Ir para o diretório do servidor
cd server

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    warning "package.json não encontrado no diretório server"
    echo "Criando package.json básico..."
    
    cat > package.json << 'EOF'
{
  "name": "truelabel-backend",
  "version": "1.0.0",
  "description": "True Label Backend - Managed",
  "main": "src/index-managed.js",
  "scripts": {
    "start": "node src/index-managed.js",
    "dev": "node src/index-managed.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
EOF
    success "package.json criado"
fi

# Verificar dependências
if [ ! -d "node_modules" ]; then
    info "Instalando dependências..."
    npm install
    success "Dependências instaladas"
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    info "Criando arquivo .env..."
    cat > .env << 'EOF'
NODE_ENV=development
PORT=3334
JWT_SECRET=minimal-jwt-secret-for-development-only-32-chars
DATABASE_URL=postgresql://postgres:truelabel123456@db.japmwgubsutskpotfayx.supabase.co:6543/postgres?sslmode=require
REDIS_ENABLED=false
EOF
    success "Arquivo .env criado"
fi

echo ""
success "🚀 Iniciando backend na porta 3334..."
echo ""
echo "📋 Informações:"
echo "   Backend: server/src/index-managed.js"
echo "   Porta: 3334"
echo "   Padrão: API Route Management System"
echo ""
echo "🔗 URLs importantes:"
echo "   Health: http://localhost:3334/health"
echo "   API Info: http://localhost:3334/api-info"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo ""

# Iniciar o backend
PORT=3334 node src/index-managed.js
