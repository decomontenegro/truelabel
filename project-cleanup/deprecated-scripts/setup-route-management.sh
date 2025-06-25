#!/bin/bash

# 🏷️ True Label API Route Management System Setup
# Configura o sistema completo de gerenciamento de rotas

echo "🏷️  True Label API Route Management Setup"
echo "========================================"

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
info "1. Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    echo "Instale Node.js em: https://nodejs.org"
    exit 1
fi

success "Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não encontrado!"
    exit 1
fi

success "npm $(npm --version) encontrado"

echo ""
info "2. Configurando permissões..."

# Tornar scripts executáveis
chmod +x api-route-*.js
chmod +x api-route-manager.js
success "Scripts tornados executáveis"

echo ""
info "3. Verificando dependências do projeto..."

# Verificar se axios está instalado
if [ -f "package.json" ]; then
    if ! npm list axios &> /dev/null; then
        info "Instalando axios..."
        npm install axios
        success "Axios instalado"
    else
        success "Axios já instalado"
    fi
else
    warning "package.json não encontrado - criando..."
    npm init -y
    npm install axios
    success "Projeto inicializado e axios instalado"
fi

echo ""
info "4. Verificando estrutura de diretórios..."

# Criar diretórios necessários
mkdir -p server/src
mkdir -p client/src/services
success "Estrutura de diretórios criada"

echo ""
info "5. Executando configuração inicial..."

# Executar correções automáticas
node api-route-manager.js fix
success "Configuração inicial aplicada"

echo ""
info "6. Executando auditoria inicial..."

# Executar auditoria para estabelecer baseline
node api-route-manager.js audit
success "Auditoria inicial concluída"

echo ""
info "7. Gerando código inicial..."

# Gerar código a partir do registry
node api-route-manager.js generate
success "Código inicial gerado"

echo ""
info "8. Validando configuração..."

# Validar configuração
if node api-route-manager.js validate; then
    success "Validação concluída com sucesso"
else
    warning "Validação encontrou alguns problemas - verifique os relatórios"
fi

echo ""
success "🎉 Setup do Sistema de Gerenciamento de Rotas concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revisar: api-route-registry.json"
echo "   2. Testar: node api-route-manager.js status"
echo "   3. Usar: node server/src/index-generated.js"
echo ""
echo "📖 Documentação: API_ROUTE_MANAGEMENT_SYSTEM.md"
echo ""
echo "🔧 Comandos úteis:"
echo "   node api-route-manager.js status    # Ver status atual"
echo "   node api-route-manager.js sync      # Sincronizar tudo"
echo "   node api-route-manager.js help      # Ver ajuda"
echo ""

# Mostrar status final
echo "📊 Status Final:"
node api-route-manager.js status

echo ""
success "✅ Sistema pronto para uso!"
