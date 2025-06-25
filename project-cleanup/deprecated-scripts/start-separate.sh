#!/bin/bash

echo "🚀 Iniciando True Label em terminais separados..."

# Terminal 1 - Backend
osascript -e 'tell app "Terminal" to do script "cd /Users/andremontenegro/true\\ label/server && npm run dev"'

echo "✅ Backend iniciado em novo terminal"

# Aguardar backend iniciar
sleep 5

# Terminal 2 - Frontend  
osascript -e 'tell app "Terminal" to do script "cd /Users/andremontenegro/true\\ label/client && npm run dev"'

echo "✅ Frontend iniciado em novo terminal"

echo ""
echo "📋 Acesse o sistema em:"
echo "   Frontend: http://localhost:9101"
echo "   Backend: http://localhost:9100"
echo ""
echo "✅ Verifique os terminais abertos!"