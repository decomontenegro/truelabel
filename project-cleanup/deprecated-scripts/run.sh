#!/bin/bash

echo "🚀 True Label - Iniciando..."
echo ""

# Matar processos anteriores
pkill -f "tsx src/index.ts" || true
pkill -f "vite" || true
sleep 2

# Backend
echo "📡 Iniciando Backend (porta 9100)..."
cd server && npm run dev &
cd ..

sleep 5

# Frontend - caminho correto com espaço
echo "🌐 Iniciando Frontend (porta 5173)..."
cd "../true label /client" && npm run dev -- --port 5173 &

echo ""
echo "✅ True Label rodando em:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:9100"
echo ""
echo "Pressione Ctrl+C para parar"

# Abrir navegador após alguns segundos
sleep 5
open http://localhost:5173

wait