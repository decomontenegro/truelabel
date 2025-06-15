#!/bin/bash

# 🛑 True Label - Script para Parar Serviços
# Versão: 1.0
# Data: 2025-06-15

echo "🛑 Parando True Label..."
echo "======================"

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

# Verificar se arquivo de sessão existe
SESSION_FILE="/Users/andremontenegro/true label/session.info"

if [ -f "$SESSION_FILE" ]; then
    info "Carregando informações da sessão..."
    source "$SESSION_FILE"
    
    if [ ! -z "$BACKEND_PID" ]; then
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            success "Backend parado (PID: $BACKEND_PID)"
        else
            warning "Backend já estava parado (PID: $BACKEND_PID)"
        fi
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            success "Frontend parado (PID: $FRONTEND_PID)"
        else
            warning "Frontend já estava parado (PID: $FRONTEND_PID)"
        fi
    fi
    
    rm "$SESSION_FILE"
    success "Arquivo de sessão removido"
else
    warning "Arquivo de sessão não encontrado. Parando todos os processos relacionados..."
    
    # Parar todos os processos relacionados
    pkill -f "index-simple" && success "Processos backend parados"
    pkill -f "vite.*3001" && success "Processos frontend parados"
fi

# Verificar portas
info "Verificando portas..."

for port in 3001 3333 3334 8080 9000; do
    if lsof -i :$port > /dev/null 2>&1; then
        warning "Porta $port ainda em uso"
        PID=$(lsof -ti :$port)
        echo "  PID: $PID"
        echo "  Para matar: kill $PID"
    fi
done

echo ""
success "🎉 True Label parado com sucesso!"
echo ""
info "Para iniciar novamente:"
echo "  ./start-truelabel-final.sh"
echo ""
