#!/bin/bash

# Script para iniciar backend e frontend em background

echo "🚀 Iniciando True Label..."

# Criar diretório de logs se não existir
mkdir -p logs

# Parar processos anteriores
echo "🛑 Parando processos anteriores..."
pkill -f "tsx src/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Iniciar backend em background
echo "📦 Iniciando backend..."
cd /Users/andremontenegro/true\ label/server
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend iniciado (PID: $BACKEND_PID)"

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 5

# Iniciar frontend em background
echo "🎨 Iniciando frontend..."
cd /Users/andremontenegro/true\ label/client
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend iniciado (PID: $FRONTEND_PID)"

# Salvar PIDs para parar depois
echo $BACKEND_PID > /Users/andremontenegro/true\ label/.backend.pid
echo $FRONTEND_PID > /Users/andremontenegro/true\ label/.frontend.pid

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📋 URLs:"
echo "   Backend:  http://localhost:9100"
echo "   Frontend: http://localhost:9101"
echo ""
echo "📁 Logs:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 Para parar, execute: ./stop-all.sh"
echo ""