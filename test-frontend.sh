#!/bin/bash

echo "🔍 Testando acesso ao frontend..."

# Tentar várias portas possíveis
PORTS=(5001 5173 3000 3001)

for PORT in "${PORTS[@]}"; do
    echo -n "Testando porta $PORT... "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|304"; then
        echo "✅ FUNCIONANDO!"
        echo "Frontend está acessível em: http://localhost:$PORT"
        # Tentar abrir no navegador
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:$PORT"
        fi
        exit 0
    else
        echo "❌ Não responde"
    fi
done

echo ""
echo "⚠️  Frontend não está acessível em nenhuma porta conhecida"
echo ""
echo "Verificando processos Node/Vite:"
ps aux | grep -E "(node|vite)" | grep -v grep | head -5