#!/bin/bash

# 🚀 Script para Iniciar Backend Mínimo do True Label

echo "🔧 Iniciando Backend Mínimo do True Label..."
echo "============================================"

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

# Navegar para o diretório do servidor
cd "/Users/andremontenegro/true label /server"

echo ""
info "1. Verificando Node.js..."

# Verificar Node.js
if command -v node &> /dev/null; then
    success "Node.js $(node --version) encontrado"
else
    error "Node.js não encontrado!"
    echo "Instale Node.js em: https://nodejs.org"
    exit 1
fi

echo ""
info "2. Criando .env mínimo..."

# Criar .env mínimo
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
JWT_SECRET=minimal-jwt-secret-for-development-only-32-chars
EOF

success "Arquivo .env criado"

echo ""
info "3. Instalando dependências mínimas..."

# Backup do package.json original
if [ -f "package.json" ] && [ ! -f "package.json.backup" ]; then
    cp package.json package.json.backup
    success "Backup do package.json original criado"
fi

# Usar package.json mínimo
cp package-minimal.json package.json
success "Package.json mínimo configurado"

# Instalar dependências
if npm install; then
    success "Dependências instaladas"
else
    error "Falha ao instalar dependências"
    exit 1
fi

echo ""
info "4. Iniciando servidor mínimo..."

echo ""
success "🎉 Configuração concluída!"
echo ""
echo "📱 O servidor será iniciado em:"
echo "   Backend: http://localhost:3000"
echo "   Health: http://localhost:3000/health"
echo "   API: http://localhost:3000/api/v1"
echo ""
echo "👥 Credenciais de teste:"
echo "   Admin: admin@truelabel.com / admin123"
echo "   Brand: marca@exemplo.com / marca123"
echo "   Lab: analista@labexemplo.com / lab123"
echo ""
echo "⏹️  Para parar: Pressione Ctrl+C"
echo ""

# Iniciar servidor
npm run dev-minimal
