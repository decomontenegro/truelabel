#!/bin/bash

echo "🛑 Parando True Label..."

# Ler PIDs salvos
if [ -f /Users/andremontenegro/true\ label/.backend.pid ]; then
    BACKEND_PID=$(cat /Users/andremontenegro/true\ label/.backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm /Users/andremontenegro/true\ label/.backend.pid
    echo "✅ Backend parado"
fi

if [ -f /Users/andremontenegro/true\ label/.frontend.pid ]; then
    FRONTEND_PID=$(cat /Users/andremontenegro/true\ label/.frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm /Users/andremontenegro/true\ label/.frontend.pid
    echo "✅ Frontend parado"
fi

# Garantir que todos os processos foram parados
pkill -f "tsx src/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Sistema parado com sucesso!"