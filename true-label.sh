#!/bin/bash

echo "🚀 True Label - Iniciando Sistema"
echo "================================="
echo ""

# Matar TODOS os processos conflitantes
echo "🧹 Limpando ambiente..."
pkill -f "node" || true
pkill -f "vite" || true
pkill -f "tsx" || true
pkill -f "next" || true
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true
lsof -t -i:5173 | xargs kill -9 2>/dev/null || true
lsof -t -i:9100 | xargs kill -9 2>/dev/null || true
sleep 3

# Diretórios
BACKEND_DIR="$(pwd)/server"
FRONTEND_DIR="/Users/andremontenegro/true label /client"

# Backend
echo "📡 Iniciando Backend..."
cd "$BACKEND_DIR"
npm run dev > ../backend-output.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

# Aguardar backend
echo "   Aguardando..."
sleep 5

# Frontend
echo ""
echo "🌐 Iniciando Frontend..."
cd "$FRONTEND_DIR"

# Forçar porta 5173
export VITE_PORT=5173
export PORT=9100

# Iniciar com host para garantir acesso
npm run dev -- --port 5173 --host 0.0.0.0 > "$(pwd)/../frontend-output.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

# Aguardar
echo "   Aguardando..."
sleep 10

# Status
echo ""
echo "================================="
echo "✅ True Label Iniciado!"
echo "================================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend: http://localhost:9100"
echo "📚 API Docs: http://localhost:9100/api-docs"
echo ""
echo "🔑 Login:"
echo "   admin@truelabel.com / Admin123!@#"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend-output.log"
echo "   Frontend: tail -f frontend-output.log"
echo ""

# Tentar abrir navegador
echo "🌐 Abrindo navegador..."
open http://localhost:5173 || true

echo ""
echo "Pressione Ctrl+C para encerrar"

# Cleanup
cleanup() {
    echo ""
    echo "Encerrando..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "tsx" || true
    pkill -f "vite" || true
    exit 0
}

trap cleanup EXIT INT TERM

# Manter rodando
wait