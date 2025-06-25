#!/bin/bash

# 🧹 True Label - Script de Organização do Projeto
# Data: 25/06/2025
# Objetivo: Limpar e organizar arquivos antes da produção

echo "🧹 Iniciando organização do projeto True Label..."

# Criar diretórios de organização
mkdir -p project-cleanup/{deprecated-docs,deprecated-configs,deprecated-scripts,essential-files}

# Backup da versão atual antes da limpeza
echo "📦 Criando backup da versão atual..."
git add .
git commit -m "🔒 Backup antes da limpeza - $(date)"

# 1. IDENTIFICAR ARQUIVOS ESSENCIAIS
echo "📋 Identificando arquivos essenciais..."

# Arquivos essenciais que devem ser mantidos
ESSENTIAL_FILES=(
    "package.json"
    "package-lock.json"
    "README.md"
    "LICENSE"
    "vercel.json"
    ".gitignore"
    "VERSION-STABLE-v1.0.0.md"
    "MAPA-DE-PROCESSOS-TRUELABEL.md"
    "DEPLOY-SUCESSO-v1.0.0.md"
)

# Diretórios essenciais
ESSENTIAL_DIRS=(
    "client/src"
    "client/public"
    "server/src"
    "server/prisma"
)

# 2. MOVER DOCUMENTAÇÕES ANTIGAS
echo "📚 Movendo documentações antigas..."

# Mover arquivos .md antigos (manter apenas os essenciais)
find . -maxdepth 1 -name "*.md" -type f ! -name "README.md" ! -name "VERSION-STABLE-v1.0.0.md" ! -name "MAPA-DE-PROCESSOS-TRUELABEL.md" ! -name "DEPLOY-SUCESSO-v1.0.0.md" -exec mv {} project-cleanup/deprecated-docs/ \;

# 3. LIMPAR ARQUIVOS .ENV DUPLICADOS
echo "🔧 Organizando arquivos de configuração..."

# Manter apenas os .env essenciais
cp .env.example project-cleanup/essential-files/
cp client/.env.example project-cleanup/essential-files/client-env.example
cp server/.env.example project-cleanup/essential-files/server-env.example

# Mover .env duplicados
find . -name ".env*" -type f ! -name ".env.example" -exec mv {} project-cleanup/deprecated-configs/ \;

# 4. LIMPAR SCRIPTS ANTIGOS
echo "🔨 Organizando scripts..."

# Mover scripts antigos (manter apenas os essenciais)
find . -maxdepth 1 -name "*.sh" -type f ! -name "organize-project.sh" -exec mv {} project-cleanup/deprecated-scripts/ \;

# 5. LIMPAR DIRETÓRIOS DEPRECATED
echo "🗑️ Movendo diretórios deprecated..."
if [ -d "deprecated-20250623-142238" ]; then
    mv deprecated-20250623-142238 project-cleanup/
fi
if [ -d "deprecated-20250623-142246" ]; then
    mv deprecated-20250623-142246 project-cleanup/
fi
if [ -d "deprecated-backup-20250615-115332" ]; then
    mv deprecated-backup-20250615-115332 project-cleanup/
fi

# 6. CRIAR ESTRUTURA LIMPA
echo "🏗️ Criando estrutura limpa..."

# Criar diretório docs organizado
mkdir -p docs/{architecture,deployment,development,user-guides}

# Mover documentações essenciais para docs/
mv VERSION-STABLE-v1.0.0.md docs/deployment/
mv MAPA-DE-PROCESSOS-TRUELABEL.md docs/development/
mv DEPLOY-SUCESSO-v1.0.0.md docs/deployment/

# 7. CRIAR ARQUIVOS DE CONFIGURAÇÃO LIMPOS
echo "⚙️ Criando configurações limpas..."

# Restaurar .env.example essenciais
cp project-cleanup/essential-files/.env.example .
cp project-cleanup/essential-files/client-env.example client/.env.example
cp project-cleanup/essential-files/server-env.example server/.env.example

# 8. GERAR RELATÓRIO
echo "📊 Gerando relatório de limpeza..."

cat > CLEANUP-REPORT.md << EOF
# 🧹 Relatório de Limpeza do Projeto

## Data: $(date)

## Arquivos Movidos:
- **Documentações antigas**: $(find project-cleanup/deprecated-docs -name "*.md" | wc -l) arquivos
- **Configurações antigas**: $(find project-cleanup/deprecated-configs -name ".env*" | wc -l) arquivos
- **Scripts antigos**: $(find project-cleanup/deprecated-scripts -name "*.sh" | wc -l) arquivos

## Estrutura Atual:
\`\`\`
true-label/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
├── docs/                   # Documentação organizada
├── project-cleanup/        # Arquivos movidos
├── package.json           # Dependências principais
├── vercel.json            # Configuração de deploy
└── README.md              # Documentação principal
\`\`\`

## Status: ✅ PROJETO ORGANIZADO
EOF

echo "✅ Organização concluída!"
echo "📋 Verifique o arquivo CLEANUP-REPORT.md para detalhes"
echo "🔍 Revise a pasta project-cleanup/ antes de deletar"
