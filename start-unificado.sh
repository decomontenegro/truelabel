#!/bin/bash

# Script para iniciar o True Label após unificação

echo "🚀 Iniciando True Label Unificado..."

# Mata processos anteriores nas portas
echo "Parando processos anteriores..."
lsof -ti:9100 | xargs kill -9 2>/dev/null
lsof -ti:9101 | xargs kill -9 2>/dev/null

# Inicia o backend
echo "Iniciando backend na porta 9100..."
(cd server && npm run dev) &
BACKEND_PID=$!

# Aguarda o backend iniciar
sleep 3

# Inicia o frontend
echo "Iniciando frontend na porta 9101..."
(cd client && npm run dev) &
FRONTEND_PID=$!

echo "✅ Sistema iniciado!"
echo "Backend (PID: $BACKEND_PID): http://localhost:9100"
echo "Frontend (PID: $FRONTEND_PID): http://localhost:9101"
echo ""
echo "Para parar, pressione Ctrl+C"

# Aguarda interrupção
wait