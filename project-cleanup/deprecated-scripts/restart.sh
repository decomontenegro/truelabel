#!/bin/bash

echo "🔄 Reiniciando True Label..."

# Parar processos
pkill -f "concurrently" 2>/dev/null
pkill -f "tsx" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "node" 2>/dev/null

sleep 2

# Iniciar novamente
cd /Users/andremontenegro/true\ label
npm run dev:all