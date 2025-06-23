#!/bin/bash

echo "🔄 Reiniciando frontend..."

# Kill frontend
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo "✓ Frontend parado"

# Start frontend
nohup npm run dev > frontend.log 2>&1 &
echo "✓ Frontend iniciando..."

# Wait for frontend to start
sleep 3

# Check if frontend is running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend reiniciado com sucesso!"
    echo "Acesse: http://localhost:3001"
else
    echo "❌ Erro ao reiniciar frontend"
    echo "Verifique frontend.log"
fi