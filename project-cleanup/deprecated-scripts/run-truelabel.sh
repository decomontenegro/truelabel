#!/bin/bash

echo "🚀 True Label - Iniciando..."
echo ""

# Limpar processos
pkill -f "tsx src/index.ts" || true
pkill -f "vite" || true
lsof -t -i:9100 | xargs kill -9 2>/dev/null || true
lsof -t -i:5173 | xargs kill -9 2>/dev/null || true
sleep 2

# Backend
echo "📡 Backend (porta 9100)..."
cd server && npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend
echo "Aguardando backend..."
sleep 5

# Frontend - usando o symlink que criamos
echo "🌐 Frontend (porta 5173)..."
cd client && npm run dev -- --port 5173 &
FRONTEND_PID=$!
cd ..

# Aguardar frontend
sleep 3

echo ""
echo "✅ True Label rodando!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:9100"
echo "API Docs: http://localhost:9100/api-docs"
echo ""
echo "Login: admin@truelabel.com / Admin123!@#"
echo ""

# Abrir navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open http://localhost:5173
fi

echo "Pressione Ctrl+C para parar"

# Cleanup
cleanup() {
    echo ""
    echo "Encerrando..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "tsx src/index.ts" || true
    pkill -f "vite" || true
    exit 0
}

trap cleanup EXIT INT TERM

wait