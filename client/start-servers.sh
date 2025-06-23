#!/bin/bash

echo "🚀 Iniciando True Label..."
echo ""

# Kill existing processes
echo "Liberando portas..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "Iniciando backend na porta 3000..."
cd ../server && npm run dev > backend.log 2>&1 &
echo "✓ Backend iniciado (PID: $!)"

# Wait for backend
sleep 3

# Start frontend  
echo "Iniciando frontend na porta 3001..."
cd ../client && npm run dev > frontend.log 2>&1 &
echo "✓ Frontend iniciado (PID: $!)"

echo ""
echo "✨ Servidores iniciados!"
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000"
echo ""
echo "🔑 Credenciais:"
echo "   admin@truelabel.com / admin123"
echo ""
echo "Para parar os servidores:"
echo "   lsof -ti:3000 | xargs kill -9"
echo "   lsof -ti:3001 | xargs kill -9"