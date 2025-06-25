#!/bin/bash

echo "🚀 Iniciando True Label (Modo Simples)..."
echo "========================================"

# Limpar portas
echo "🧹 Limpando portas..."
lsof -ti:9100 | xargs kill -9 2>/dev/null || true
lsof -ti:9101 | xargs kill -9 2>/dev/null || true

# Backend
echo ""
echo "📦 Iniciando Backend Simples na porta 9100..."
cd "/Users/andremontenegro/true label/server"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.development..."
    cp .env.development .env
fi

# Compilar e iniciar
echo "🔨 Compilando TypeScript..."
npx tsx src/index-simple.ts &
BACKEND_PID=$!

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 3

# Verificar se backend está rodando
echo ""
echo "🧪 Testando conexão..."
if curl -s http://localhost:9100/health | jq . ; then
    echo ""
    echo "✅ Backend rodando com sucesso!"
else
    echo "❌ Erro ao conectar com backend"
fi

echo ""
echo "🌐 URLs de Acesso:"
echo "=================="
echo "Backend: http://localhost:9100"
echo "Health: http://localhost:9100/health"
echo "API: http://localhost:9100/api/v1"
echo ""
echo "🔑 Credenciais de teste:"
echo "admin@truelabel.com / admin123"
echo ""
echo "Para parar: Ctrl+C"
echo ""

# Manter script rodando
wait $BACKEND_PID