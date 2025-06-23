#!/bin/bash

echo "🚀 TRUST LABEL - Instalação e Execução Automática"
echo "==========================================="

# Navegar para o diretório do projeto
cd "$(dirname "$0")"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
else
    echo "✅ Dependências já instaladas"
fi

# Criar diretório de uploads se não existir
mkdir -p uploads

# Iniciar o servidor
echo ""
echo "🎉 Iniciando TRUST LABEL..."
echo ""
echo "🌐 Acesse: http://localhost:3001/trust-label-interactive.html"
echo "🔐 Login: admin@trustlabel.com / admin123"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

node server.js