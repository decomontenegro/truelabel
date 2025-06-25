#\!/bin/bash
echo "🔍 Testando Backend True Label..."
cd ~/true\ label
echo "📁 Diretório: $(pwd)"
echo ""
echo "📄 Verificando arquivo:"
ls -la server/src/index-managed.js
echo ""
echo "📦 Verificando dependências:"
ls -la server/node_modules 2>/dev/null || echo "❌ node_modules não existe\!"
echo ""
echo "🚀 Tentando iniciar..."
cd server && node src/index-managed.js
EOF < /dev/null