#!/bin/bash

# Parar processos anteriores
echo "Parando processos..."
pkill -f "tsx" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "node" 2>/dev/null
sleep 2

# Iniciar backend
echo "Iniciando backend..."
cd /Users/andremontenegro/true\ label/server
npm run dev &
sleep 5

# Iniciar frontend
echo "Iniciando frontend..."
cd /Users/andremontenegro/true\ label/client
npm run dev

echo "Sistema iniciado!"