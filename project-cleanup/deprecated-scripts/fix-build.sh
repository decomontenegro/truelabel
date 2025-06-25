#!/bin/bash

# 🔧 Script para Corrigir o Build do True Label

echo "🔧 Corrigindo build do True Label..."
echo "=================================="

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

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório client/"
    exit 1
fi

echo ""
info "1. Limpando cache e builds antigos..."

# Limpar cache do npm
npm cache clean --force 2>/dev/null || true
success "Cache do npm limpo"

# Remover node_modules e reinstalar
if [ -d "node_modules" ]; then
    info "Removendo node_modules..."
    rm -rf node_modules
    success "node_modules removido"
fi

# Remover dist se existir
if [ -d "dist" ]; then
    rm -rf dist
    success "Diretório dist removido"
fi

echo ""
info "2. Reinstalando dependências..."

# Reinstalar dependências
if npm install; then
    success "Dependências instaladas com sucesso"
else
    error "Falha ao instalar dependências"
    exit 1
fi

echo ""
info "3. Verificando configuração do Vite..."

# Verificar se vite.config.ts existe
if [ ! -f "vite.config.ts" ]; then
    warning "vite.config.ts não encontrado, criando configuração básica..."
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
})
EOF
    success "vite.config.ts criado"
fi

echo ""
info "4. Construindo aplicação..."

# Build da aplicação
if npm run build; then
    success "Build concluído com sucesso!"
else
    error "Falha no build"
    echo ""
    warning "Tentando build com configuração alternativa..."
    
    # Criar configuração alternativa
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
EOF
    
    if npm run build; then
        success "Build alternativo concluído!"
    else
        error "Build falhou mesmo com configuração alternativa"
        exit 1
    fi
fi

echo ""
info "5. Verificando build..."

if [ -f "dist/index.html" ]; then
    success "index.html gerado"
else
    error "index.html não foi gerado"
    exit 1
fi

if [ -d "dist/assets" ]; then
    success "Assets gerados"
else
    warning "Pasta assets não encontrada"
fi

echo ""
success "🎉 Build corrigido com sucesso!"
echo ""
echo "📱 Próximos passos:"
echo "1. Execute: npm run dev"
echo "2. Ou execute: npm run preview (para testar o build)"
echo "3. Acesse: http://localhost:3001"
echo ""
echo "🔧 Se ainda houver problemas:"
echo "1. Verifique o console do browser (F12)"
echo "2. Execute: npm run dev --verbose"
echo "3. Verifique se o backend está rodando na porta 3000"
echo ""
