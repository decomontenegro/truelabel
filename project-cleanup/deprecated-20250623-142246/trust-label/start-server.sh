#!/bin/bash

# Script para iniciar o servidor TRUST LABEL

echo "🚀 Iniciando TRUST LABEL Server..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install express cors
fi

# Iniciar o servidor
echo "✅ Servidor rodando em http://localhost:3001"
node server-simple.js