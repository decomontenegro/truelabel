#!/bin/bash

# 🔍 True Label - Railway URL Finder
# Testa URLs possíveis do Railway para encontrar o backend

echo "🔍 Procurando URL do Railway..."
echo "=============================="

# URLs possíveis baseadas em padrões comuns do Railway
POSSIBLE_URLS=(
    "https://truelabel-production.up.railway.app"
    "https://web-production.up.railway.app" 
    "https://true-label-production.up.railway.app"
    "https://truelabel.up.railway.app"
    "https://web-production-1234.up.railway.app"
    "https://web-production-5678.up.railway.app"
    "https://web-production-9abc.up.railway.app"
    "https://web-production-def0.up.railway.app"
)

echo "Testando URLs possíveis..."
echo ""

for url in "${POSSIBLE_URLS[@]}"; do
    echo -n "Testando: $url ... "
    
    if curl -f -s "$url/health" > /dev/null 2>&1; then
        echo "✅ ENCONTRADO!"
        echo ""
        echo "🎉 URL do Railway encontrada: $url"
        echo ""
        echo "Agora execute:"
        echo "./configure-railway-integration.sh $url"
        exit 0
    else
        echo "❌ Não encontrado"
    fi
done

echo ""
echo "❌ Nenhuma URL padrão funcionou."
echo ""
echo "📋 Para encontrar a URL correta:"
echo "1. Acesse: https://railway.app/dashboard"
echo "2. Clique no seu projeto True Label"
echo "3. Vá para 'Settings' > 'Domains'"
echo "4. Copie a URL mostrada"
echo ""
echo "Ou verifique na aba 'Deployments' - a URL aparece lá."
echo ""
echo "Depois execute:"
echo "./configure-railway-integration.sh [SUA-URL-AQUI]"
