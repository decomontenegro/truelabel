#!/bin/bash

echo "🚀 Iniciando True Label Development..."
echo "=================================="

# Limpar portas
echo "🧹 Limpando portas..."
lsof -ti:9100 | xargs kill -9 2>/dev/null || true
lsof -ti:9101 | xargs kill -9 2>/dev/null || true

# Backend
echo ""
echo "📦 Iniciando Backend na porta 9100..."
cd "/Users/andremontenegro/true label/server"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.development..."
    cp .env.development .env
fi

# Iniciar backend
npm run dev &
BACKEND_PID=$!

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 5

# Verificar se backend está rodando
if curl -s http://localhost:9100/health > /dev/null 2>&1; then
    echo "✅ Backend rodando em http://localhost:9100"
else
    echo "❌ Backend não iniciou corretamente"
fi

echo ""
echo "🌐 URLs de Acesso:"
echo "=================="
echo "Backend: http://localhost:9100"
echo "Health: http://localhost:9100/health"
echo "API: http://localhost:9100/api/v1"
echo ""
echo "Para parar: Ctrl+C"
echo ""

# Manter script rodando
wait $BACKEND_PID