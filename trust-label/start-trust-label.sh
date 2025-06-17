#!/bin/bash

echo "🚀 Iniciando TRUST Label - Sistema Completo"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se Python está instalado
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Python 3 não encontrado. Por favor, instale Python 3 para continuar.${NC}"
        exit 1
    fi
}

# Função para instalar dependências Python se necessário
install_python_deps() {
    echo -e "${YELLOW}Verificando dependências Python...${NC}"
    
    # Check if flask is installed
    if ! python3 -c "import flask" 2>/dev/null; then
        echo -e "${YELLOW}Instalando Flask...${NC}"
        pip3 install flask flask-cors
    fi
}

# Função para matar processos nas portas
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Parando processo na porta $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
    fi
}

# Verificar Python
check_python

# Instalar dependências se necessário
install_python_deps

# Limpar portas se já estiverem em uso
echo -e "${YELLOW}Verificando portas...${NC}"
kill_port 8001
kill_port 5001

echo ""
echo -e "${GREEN}✅ Preparação concluída!${NC}"
echo ""

# Iniciar servidor web
echo -e "${BLUE}1. Iniciando servidor web na porta 8001...${NC}"
python3 start-web-server.py &
WEB_PID=$!

# Aguardar um pouco
sleep 2

# Iniciar API de tracking
echo -e "${BLUE}2. Iniciando API de QR Tracking na porta 5001...${NC}"
python3 qr-tracking-api.py &
API_PID=$!

# Aguardar um pouco
sleep 2

# Iniciar sistema de validação laboratorial
echo -e "${BLUE}3. Iniciando Sistema de Validação Laboratorial na porta 5002...${NC}"
python3 lab-validation-system.py &
LAB_PID=$!

# Aguardar serviços iniciarem
sleep 3

echo ""
echo -e "${GREEN}✨ TRUST Label está rodando!${NC}"
echo ""
echo "📍 Acesse os seguintes endereços:"
echo ""
echo -e "${BLUE}Sistema Principal:${NC}"
echo "  http://localhost:8001/trust-label-enhanced.html"
echo ""
echo -e "${BLUE}Dashboard de Analytics:${NC}"
echo "  http://localhost:8001/qr-analytics-dashboard.html"
echo ""
echo -e "${BLUE}Portal de Validação Laboratorial:${NC}"
echo "  http://localhost:8001/lab-validation-portal.html"
echo ""
echo -e "${BLUE}Página de Verificação (Consumidor):${NC}"
echo "  http://localhost:8001/verify.html"
echo ""
echo -e "${BLUE}API de Tracking:${NC}"
echo "  http://localhost:5001"
echo ""
echo -e "${BLUE}API de Validação Laboratorial:${NC}"
echo "  http://localhost:5002"
echo ""
echo -e "${YELLOW}Para parar os serviços, pressione Ctrl+C${NC}"
echo ""

# Função para limpar ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}Parando serviços...${NC}"
    kill $WEB_PID 2>/dev/null
    kill $API_PID 2>/dev/null
    kill $LAB_PID 2>/dev/null
    echo -e "${GREEN}Serviços parados com sucesso!${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup INT

# Manter script rodando
while true; do
    sleep 1
done