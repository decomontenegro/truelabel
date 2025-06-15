#!/bin/bash
# Script para testar o build localmente

echo "🧪 Testando build do True Label..."

# Ir para o diretório do projeto
PROJECT_DIR="/Users/andremontenegro/true label "

# Testar build do cliente
echo "📦 Testando build do cliente..."
cd "$PROJECT_DIR/client"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build do cliente concluído com sucesso!"
    echo "📁 Verificando arquivos gerados..."
    ls -la dist/ | head -10
else
    echo "❌ Erro no build do cliente"
    exit 1
fi

echo "🎉 Teste de build concluído!"