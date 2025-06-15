#!/bin/bash

# 🏷️ True Label - Limpeza de Arquivos Deprecated
# Remove arquivos antigos que não seguem os novos padrões

echo "🏷️  True Label - Limpeza de Arquivos Deprecated"
echo "============================================="

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
warning "ATENÇÃO: Este script irá remover arquivos deprecated!"
echo "Arquivos que serão movidos para backup:"
echo "   - server/src/index-ultra-simple.js"
echo "   - server/src/index-simple.js"
echo "   - server/src/index-clean.js"
echo ""

read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "Operação cancelada pelo usuário"
    exit 0
fi

echo ""
info "Iniciando limpeza..."

# Criar diretório de backup
BACKUP_DIR="deprecated-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
success "Diretório de backup criado: $BACKUP_DIR"

# Lista de arquivos deprecated
DEPRECATED_FILES=(
    "server/src/index-ultra-simple.js"
    "server/src/index-simple.js"
    "server/src/index-clean.js"
    "start-truelabel.sh"
    "start-backend-now.sh"
    "restart-backend.sh"
)

MOVED_COUNT=0

echo ""
info "Movendo arquivos deprecated para backup..."

for file in "${DEPRECATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$BACKUP_DIR/"
        success "Movido: $file"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    else
        info "Não encontrado: $file"
    fi
done

echo ""
info "Verificando outros arquivos deprecated..."

# Verificar outros possíveis arquivos deprecated
find . -name "*.js.bak" -type f 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        mv "$file" "$BACKUP_DIR/"
        success "Movido backup: $file"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
done

# Verificar arquivos .env.bak
find . -name ".env.bak" -type f 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        mv "$file" "$BACKUP_DIR/"
        success "Movido backup: $file"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
done

echo ""
info "Criando arquivo README no backup..."

cat > "$BACKUP_DIR/README.md" << EOF
# Backup de Arquivos Deprecated - True Label

## Data do Backup
$(date)

## Arquivos Movidos
Este diretório contém arquivos que foram removidos durante a migração para os novos padrões de programação do True Label.

## Arquivos Deprecated
- \`index-ultra-simple.js\` - Backend simplificado (substituído por index-managed.js)
- \`index-simple.js\` - Backend básico (substituído por index-managed.js)
- \`index-clean.js\` - Backend limpo (substituído por index-managed.js)
- Scripts de inicialização antigos

## Novo Padrão
A partir de agora, use apenas:
- \`server/src/index-managed.js\` - Backend principal
- \`./start-backend-managed.sh\` - Script de inicialização
- Sistema de gerenciamento de rotas

## Restauração
Se precisar restaurar algum arquivo:
\`\`\`bash
cp $BACKUP_DIR/arquivo-desejado ./local-original/
\`\`\`

## Documentação
- TRUE_LABEL_PROGRAMMING_STANDARDS.md
- API_ROUTE_MANAGEMENT_SYSTEM.md
EOF

success "README criado no backup"

echo ""
info "Atualizando .gitignore..."

# Adicionar entradas ao .gitignore se não existirem
GITIGNORE_ENTRIES=(
    "deprecated-backup-*/"
    "backup-*/"
    "*.log"
    "api-route-*-report.json"
)

if [ ! -f ".gitignore" ]; then
    touch .gitignore
    success ".gitignore criado"
fi

for entry in "${GITIGNORE_ENTRIES[@]}"; do
    if ! grep -q "^$entry$" .gitignore 2>/dev/null; then
        echo "$entry" >> .gitignore
        success "Adicionado ao .gitignore: $entry"
    fi
done

echo ""
success "🎉 Limpeza concluída!"
echo ""
echo "📊 Resumo:"
echo "   Arquivos movidos: $MOVED_COUNT"
echo "   Backup criado em: $BACKUP_DIR"
echo "   .gitignore atualizado"
echo ""
echo "📋 Próximos passos:"
echo "   1. Testar: ./start-backend-managed.sh"
echo "   2. Verificar: ./check-compliance.sh"
echo "   3. Usar apenas: server/src/index-managed.js"
echo ""
warning "IMPORTANTE: Use apenas os arquivos do novo padrão a partir de agora!"
echo ""
info "Para verificar conformidade:"
echo "   ./check-compliance.sh"
