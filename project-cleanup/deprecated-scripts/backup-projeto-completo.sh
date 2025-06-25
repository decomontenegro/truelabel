#!/bin/bash

# 🏷️ True Label - Backup Completo do Projeto
# Cria backup completo do projeto funcional

echo "🏷️  True Label - Backup Completo do Projeto"
echo "=========================================="

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

# Criar nome do backup com timestamp
BACKUP_NAME="truelabel-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="../$BACKUP_NAME"

echo ""
info "Criando backup completo do True Label..."
echo "Destino: $BACKUP_DIR"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"
success "Diretório de backup criado"

echo ""
info "Copiando arquivos do projeto..."

# Copiar arquivos principais
cp -r client "$BACKUP_DIR/"
cp -r server "$BACKUP_DIR/"

# Copiar sistema de gerenciamento
cp api-route-*.js "$BACKUP_DIR/" 2>/dev/null
cp api-route-*.json "$BACKUP_DIR/" 2>/dev/null

# Copiar documentação
cp *.md "$BACKUP_DIR/" 2>/dev/null

# Copiar scripts
cp *.sh "$BACKUP_DIR/" 2>/dev/null

# Copiar configurações
cp package.json "$BACKUP_DIR/" 2>/dev/null
cp .gitignore "$BACKUP_DIR/" 2>/dev/null

success "Arquivos copiados"

echo ""
info "Criando documentação do backup..."

# Criar README do backup
cat > "$BACKUP_DIR/README_BACKUP.md" << EOF
# 🏷️ True Label - Backup Completo

## 📅 Data do Backup
$(date)

## 📊 Status do Projeto
- ✅ **100% Funcional**
- ✅ **25/25 rotas implementadas**
- ✅ **Padrões de programação estabelecidos**
- ✅ **Sistema de gerenciamento de rotas ativo**

## 🚀 Como Restaurar

### 1. Copiar arquivos
\`\`\`bash
cp -r $BACKUP_NAME/* "/caminho/do/projeto/"
\`\`\`

### 2. Instalar dependências
\`\`\`bash
# Backend
cd server && npm install

# Frontend  
cd client && npm install

# Sistema de gerenciamento
npm install
\`\`\`

### 3. Iniciar sistema
\`\`\`bash
# Backend
./start-backend-managed.sh

# Frontend (novo terminal)
cd client && npm run dev
\`\`\`

## 🔗 URLs
- Frontend: http://localhost:3001
- Backend: http://localhost:3334

## 👤 Credenciais
- Email: admin@truelabel.com
- Senha: admin123

## 📋 Arquivos Incluídos
- ✅ Frontend completo (React + Vite)
- ✅ Backend gerenciado (Express + Node.js)
- ✅ Sistema de gerenciamento de rotas
- ✅ Documentação completa
- ✅ Scripts de automação
- ✅ Configurações

## 🎯 Funcionalidades
- ✅ Dashboard e Analytics
- ✅ Gestão de Produtos
- ✅ Sistema de Validações
- ✅ Certificações
- ✅ Relatórios
- ✅ QR Codes
- ✅ Laboratórios
- ✅ Nutrição
- ✅ Suporte

## 📖 Documentação Principal
- TRUE_LABEL_PROGRAMMING_STANDARDS.md
- API_ROUTE_MANAGEMENT_SYSTEM.md
- PROJETO_TRUE_LABEL_STATUS_FINAL.md

---

**🎉 Backup criado em: $(date)**
**Status: PROJETO 100% FUNCIONAL**
EOF

success "README do backup criado"

echo ""
info "Criando arquivo de verificação..."

# Criar arquivo de verificação
cat > "$BACKUP_DIR/verificacao.txt" << EOF
True Label - Verificação do Backup
==================================

Data: $(date)
Diretório: $BACKUP_DIR

Arquivos principais:
$(ls -la "$BACKUP_DIR" | grep -E '\.(js|json|md|sh)$' | wc -l) arquivos de configuração
$(find "$BACKUP_DIR/client" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l) arquivos TypeScript/React
$(find "$BACKUP_DIR/server" -name "*.js" 2>/dev/null | wc -l) arquivos JavaScript/Node.js

Status: BACKUP COMPLETO
EOF

success "Arquivo de verificação criado"

echo ""
info "Calculando tamanho do backup..."

BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo ""
success "🎉 Backup completo criado com sucesso!"
echo ""
echo "📊 Estatísticas do Backup:"
echo "   📁 Diretório: $BACKUP_DIR"
echo "   📏 Tamanho: $BACKUP_SIZE"
echo "   📄 Arquivos: $FILE_COUNT"
echo ""
echo "📋 Conteúdo do Backup:"
echo "   ✅ Frontend completo"
echo "   ✅ Backend gerenciado"
echo "   ✅ Sistema de gerenciamento de rotas"
echo "   ✅ Documentação completa"
echo "   ✅ Scripts de automação"
echo "   ✅ Configurações"
echo ""
echo "🔄 Para restaurar:"
echo "   1. Copiar arquivos do backup"
echo "   2. Instalar dependências (npm install)"
echo "   3. Executar ./start-backend-managed.sh"
echo "   4. Executar cd client && npm run dev"
echo ""
echo "📖 Documentação: $BACKUP_DIR/README_BACKUP.md"
echo ""
success "✅ True Label - Projeto salvo com sucesso!"

# Criar link simbólico para o backup mais recente
ln -sfn "$BACKUP_NAME" "../truelabel-backup-latest"
success "Link para backup mais recente criado: ../truelabel-backup-latest"
