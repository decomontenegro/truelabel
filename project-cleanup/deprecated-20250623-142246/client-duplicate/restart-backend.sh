#!/bin/bash

echo "🔄 Reiniciando backend..."

# Kill backend
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "✓ Backend parado"

# Start backend
cd ../server && nohup npm run dev > backend.log 2>&1 &
echo "✓ Backend iniciando..."

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend reiniciado com sucesso!"
else
    echo "❌ Erro ao reiniciar backend"
    echo "Verifique ../server/backend.log"
fi