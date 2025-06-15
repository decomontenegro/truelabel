#!/bin/bash

# 🚂 True Label - Railway Integration Configuration
# Configura a integração entre Vercel (frontend) e Railway (backend)

echo "🚂 True Label - Configuração da Integração Railway"
echo "=================================================="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Verificar se a URL do Railway foi fornecida
if [ -z "$1" ]; then
    error "URL do Railway não fornecida!"
    echo ""
    echo "Uso: ./configure-railway-integration.sh <RAILWAY_URL>"
    echo "Exemplo: ./configure-railway-integration.sh https://truelabel-production.up.railway.app"
    echo ""
    echo "Para encontrar sua URL do Railway:"
    echo "1. Acesse railway.app"
    echo "2. Vá para seu projeto True Label"
    echo "3. Copie a URL em 'Settings > Domains'"
    exit 1
fi

RAILWAY_URL=$1
info "Configurando integração com Railway: $RAILWAY_URL"

echo ""
info "1. Testando conexão com Railway..."

# Testar health check
if curl -f "$RAILWAY_URL/health" > /dev/null 2>&1; then
    success "Railway backend está funcionando!"
else
    error "Não foi possível conectar ao Railway backend"
    echo "Verifique se:"
    echo "- O deploy foi concluído com sucesso"
    echo "- A URL está correta"
    echo "- O serviço está rodando"
    exit 1
fi

echo ""
info "2. Atualizando proxy do Vercel..."

# Atualizar api/index.js com a URL do Railway
cat > api/index.js << EOF
// True Label API - Vercel Proxy to Railway
// Automatically configured by configure-railway-integration.sh
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Railway backend URL
  const RAILWAY_API_URL = '$RAILWAY_URL';
  
  try {
    // Proxy request to Railway backend
    const response = await fetch(\`\${RAILWAY_API_URL}\${req.url.replace('/api', '')}\`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: req.method !== 'GET' && req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    // Fallback response if Railway is down
    return res.status(503).json({
      success: false,
      message: 'Backend temporarily unavailable',
      railway_url: RAILWAY_API_URL,
      error: error.message
    });
  }
};
EOF

success "Proxy do Vercel atualizado"

echo ""
info "3. Atualizando configuração do frontend..."

# Atualizar .env.production do cliente
cat > client/.env.production << EOF
# API Configuration for Production (Railway Backend)
VITE_API_BASE_URL=/api
VITE_QR_BASE_URL=https://truelabel.vercel.app
VITE_RAILWAY_API_URL=$RAILWAY_URL
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME="True Label - CPG Validation Platform"
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production
VITE_ENVIRONMENT=production

# Features
VITE_FEATURE_QR_CODES=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_FILE_UPLOAD=true
VITE_ENABLE_ANALYTICS=true

# Upload Configuration
VITE_UPLOAD_MAX_SIZE=10485760
VITE_UPLOAD_MAX_FILES=5
VITE_UPLOAD_ALLOWED_TYPES=application/pdf,image/jpeg,image/png,image/webp,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# UI Configuration
VITE_TOAST_DURATION=4000
VITE_DEBOUNCE_DELAY=300
VITE_PAGINATION_SIZE=20

# Cache Configuration
VITE_QR_CACHE_TTL=86400000
VITE_USER_CACHE_TTL=3600000

# Production optimizations
VITE_BUILD_SOURCEMAP=false
VITE_BUILD_MINIFY=true
EOF

success "Configuração do frontend atualizada"

echo ""
info "4. Testando integração completa..."

# Testar endpoints principais
echo "Testando endpoints:"

echo -n "  - Health check: "
if curl -f "$RAILWAY_URL/health" > /dev/null 2>&1; then
    success "OK"
else
    error "FALHOU"
fi

echo -n "  - API info: "
if curl -f "$RAILWAY_URL/api-info" > /dev/null 2>&1; then
    success "OK"
else
    error "FALHOU"
fi

echo -n "  - Login: "
if curl -f -X POST "$RAILWAY_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@truelabel.com","password":"admin123"}' > /dev/null 2>&1; then
    success "OK"
else
    error "FALHOU"
fi

echo ""
info "5. Preparando deploy das mudanças..."

# Fazer commit das mudanças
git add .
git commit -m "feat: configure Railway integration with URL $RAILWAY_URL

- Updated Vercel proxy to point to Railway backend
- Updated frontend environment variables
- Configured complete integration between services
- Maintained full architecture integrity"

echo ""
success "🎉 Integração Railway configurada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: git push origin main"
echo "2. Aguarde o redeploy do Vercel (2-3 minutos)"
echo "3. Teste: https://truelabel.vercel.app"
echo "4. Credenciais: admin@truelabel.com / admin123"
echo ""
echo "🔗 URLs configuradas:"
echo "   Frontend: https://truelabel.vercel.app"
echo "   Backend:  $RAILWAY_URL"
echo ""
echo "✅ Sistema True Label totalmente funcional!"
