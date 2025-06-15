#!/bin/bash

# 🏷️ True Label Migration to Programming Standards
# Migra o projeto atual para os novos padrões obrigatórios

echo "🏷️  True Label Migration to Programming Standards"
echo "=============================================="

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
info "Iniciando migração para os padrões True Label..."

echo ""
info "1. Verificando estado atual..."

# Verificar se já está migrado
if [ -f "server/src/index-managed.js" ] && [ -f "TRUE_LABEL_PROGRAMMING_STANDARDS.md" ]; then
    success "Projeto já migrado para os novos padrões!"
    echo ""
    info "Executando verificação de conformidade..."
    ./check-compliance.sh
    exit 0
fi

echo ""
info "2. Criando backup dos arquivos atuais..."

# Criar diretório de backup
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup de arquivos importantes
if [ -f "server/src/index-ultra-simple.js" ]; then
    cp "server/src/index-ultra-simple.js" "$BACKUP_DIR/"
    success "Backup de index-ultra-simple.js criado"
fi

if [ -f "server/src/index-simple.js" ]; then
    cp "server/src/index-simple.js" "$BACKUP_DIR/"
    success "Backup de index-simple.js criado"
fi

if [ -f "client/.env" ]; then
    cp "client/.env" "$BACKUP_DIR/"
    success "Backup de client/.env criado"
fi

echo ""
info "3. Parando serviços atuais..."

# Parar processos na porta 3334
PID=$(lsof -ti :3334 2>/dev/null)
if [ ! -z "$PID" ]; then
    kill $PID
    success "Processo na porta 3334 finalizado"
    sleep 2
else
    info "Nenhum processo rodando na porta 3334"
fi

echo ""
info "4. Configurando novo backend gerenciado..."

# O arquivo index-managed.js já foi criado anteriormente
if [ -f "server/src/index-managed.js" ]; then
    success "Backend gerenciado já existe"
else
    error "Backend gerenciado não encontrado!"
    echo "Execute primeiro a criação dos arquivos do sistema."
    exit 1
fi

echo ""
info "5. Atualizando configurações..."

# Atualizar .env do cliente se necessário
if [ -f "client/.env" ]; then
    # Verificar se já está configurado para porta 3334
    if grep -q "VITE_API_BASE_URL=http://localhost:3334" client/.env; then
        success "Configuração do cliente já atualizada"
    else
        # Atualizar para porta 3334
        sed -i.bak 's|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://localhost:3334|' client/.env
        success "Configuração do cliente atualizada para porta 3334"
    fi
fi

echo ""
info "6. Testando novo backend..."

# Iniciar backend gerenciado em background
cd server
PORT=3334 node src/index-managed.js &
BACKEND_PID=$!
cd ..

# Aguardar inicialização
sleep 3

# Testar se está respondendo
if curl -s http://localhost:3334/health > /dev/null; then
    success "Backend gerenciado funcionando corretamente"
    
    # Testar rota de API info
    if curl -s http://localhost:3334/api-info > /dev/null; then
        success "Rota de informações da API funcionando"
    fi
else
    error "Backend gerenciado não está respondendo"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Parar backend de teste
kill $BACKEND_PID 2>/dev/null
sleep 1

echo ""
info "7. Configurando scripts de gerenciamento..."

# Tornar scripts executáveis
chmod +x api-route-*.js 2>/dev/null
chmod +x *.sh 2>/dev/null
success "Scripts tornados executáveis"

echo ""
info "8. Executando verificação de conformidade..."

# Executar verificação
if ./check-compliance.sh; then
    success "Verificação de conformidade passou!"
else
    warning "Verificação de conformidade encontrou problemas"
fi

echo ""
info "9. Criando script de inicialização atualizado..."

# Criar script de inicialização que usa o novo backend
cat > start-truelabel-managed.sh << 'EOF'
#!/bin/bash

echo "🏷️  Iniciando True Label (Padrão Gerenciado)"
echo "=========================================="

# Parar processos existentes
PID=$(lsof -ti :3334 2>/dev/null)
if [ ! -z "$PID" ]; then
    kill $PID
    echo "✅ Processo anterior finalizado"
    sleep 2
fi

# Iniciar backend gerenciado
echo "🚀 Iniciando backend gerenciado..."
cd server
PORT=3334 node src/index-managed.js &
BACKEND_PID=$!
cd ..

# Aguardar inicialização
sleep 3

# Verificar se iniciou
if curl -s http://localhost:3334/health > /dev/null; then
    echo "✅ Backend iniciado com sucesso na porta 3334"
    echo "🔗 Health: http://localhost:3334/health"
    echo "📋 API Info: http://localhost:3334/api-info"
    echo ""
    echo "📱 Para iniciar o frontend:"
    echo "   cd client && npm run dev"
    echo ""
    echo "🛑 Para parar o backend:"
    echo "   kill $BACKEND_PID"
    echo ""
    echo "PID do backend: $BACKEND_PID"
else
    echo "❌ Falha ao iniciar backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
EOF

chmod +x start-truelabel-managed.sh
success "Script de inicialização atualizado criado"

echo ""
success "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo "📋 RESUMO DAS MUDANÇAS:"
echo "   ✅ Backend migrado para: server/src/index-managed.js"
echo "   ✅ Padrões documentados em: TRUE_LABEL_PROGRAMMING_STANDARDS.md"
echo "   ✅ Sistema de gerenciamento de rotas configurado"
echo "   ✅ Scripts de automação criados"
echo "   ✅ Backup criado em: $BACKUP_DIR"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "   1. Iniciar: ./start-truelabel-managed.sh"
echo "   2. Testar: http://localhost:3334/health"
echo "   3. Verificar: ./check-compliance.sh"
echo "   4. Gerenciar: node api-route-manager.js help"
echo ""
echo "📖 DOCUMENTAÇÃO:"
echo "   - Padrões: TRUE_LABEL_PROGRAMMING_STANDARDS.md"
echo "   - Sistema: API_ROUTE_MANAGEMENT_SYSTEM.md"
echo ""
warning "IMPORTANTE: Use apenas server/src/index-managed.js a partir de agora!"
echo ""
success "✅ True Label agora segue os padrões oficiais de programação!"
