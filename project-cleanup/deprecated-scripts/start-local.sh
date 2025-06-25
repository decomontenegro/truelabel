#!/bin/bash

# 🚀 Script para Iniciar True Label Localmente

echo "🏷️  Iniciando True Label - Plataforma de Validação CPG"
echo "=================================================="

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado!"
    echo "Por favor, instale Node.js (versão 18+) em: https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm não encontrado!"
    echo "Por favor, instale npm junto com Node.js"
    exit 1
fi

success "Node.js $(node --version) encontrado"
success "npm $(npm --version) encontrado"

echo ""
info "1. Verificando estrutura do projeto..."

# Verificar se estamos no diretório correto
if [ ! -d "client" ] || [ ! -d "server" ]; then
    error "Diretórios client/ e server/ não encontrados!"
    echo "Execute este script na raiz do projeto True Label"
    exit 1
fi

success "Estrutura do projeto verificada"

echo ""
info "2. Instalando dependências..."

# Instalar dependências do servidor
echo "📦 Instalando dependências do servidor..."
cd server
if npm install; then
    success "Dependências do servidor instaladas"
else
    error "Falha ao instalar dependências do servidor"
    exit 1
fi

# Instalar dependências do cliente
echo "📦 Instalando dependências do cliente..."
cd ../client
if npm install; then
    success "Dependências do cliente instaladas"
else
    error "Falha ao instalar dependências do cliente"
    exit 1
fi

cd ..

echo ""
info "3. Configurando banco de dados..."

cd server

# Verificar se o banco existe
if [ ! -f "prisma/dev.db" ]; then
    info "Criando banco de dados..."
    
    # Gerar cliente Prisma
    if npm run generate; then
        success "Cliente Prisma gerado"
    else
        error "Falha ao gerar cliente Prisma"
        exit 1
    fi
    
    # Executar migrações
    if npm run migrate; then
        success "Migrações executadas"
    else
        error "Falha ao executar migrações"
        exit 1
    fi
    
    # Popular com dados de teste
    if npm run seed; then
        success "Dados de teste inseridos"
    else
        warning "Falha ao inserir dados de teste (continuando...)"
    fi
else
    success "Banco de dados já existe"
fi

cd ..

echo ""
info "4. Iniciando servidores..."

# Função para cleanup ao sair
cleanup() {
    echo ""
    info "Parando servidores..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar servidor backend
echo "🔧 Iniciando servidor backend..."
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Aguardar servidor iniciar
sleep 3

# Verificar se servidor está rodando
if kill -0 $SERVER_PID 2>/dev/null; then
    success "Servidor backend iniciado (PID: $SERVER_PID)"
else
    error "Falha ao iniciar servidor backend"
    echo "Verifique server.log para detalhes"
    exit 1
fi

# Iniciar cliente frontend
echo "🎨 Iniciando cliente frontend..."
cd client
npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Aguardar cliente iniciar
sleep 5

# Verificar se cliente está rodando
if kill -0 $CLIENT_PID 2>/dev/null; then
    success "Cliente frontend iniciado (PID: $CLIENT_PID)"
else
    error "Falha ao iniciar cliente frontend"
    echo "Verifique client.log para detalhes"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
success "🎉 True Label iniciado com sucesso!"
echo ""
echo "📱 Acesse a aplicação:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:3000"
echo ""
echo "👥 Credenciais de teste:"
echo "   Admin: admin@truelabel.com / admin123"
echo "   Brand: marca@exemplo.com / marca123"
echo "   Lab:   analista@labexemplo.com / lab123"
echo ""
echo "🧪 Páginas de teste:"
echo "   Design System: http://localhost:3001/design-system"
echo "   Teste QR:      http://localhost:3001/dashboard/test-qr"
echo ""
echo "📊 Monitoramento:"
echo "   Logs servidor: tail -f server.log"
echo "   Logs cliente:  tail -f client.log"
echo ""
echo "⏹️  Para parar: Pressione Ctrl+C"
echo ""

# Aguardar indefinidamente
while true; do
    # Verificar se os processos ainda estão rodando
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        error "Servidor backend parou inesperadamente"
        echo "Verifique server.log para detalhes"
        break
    fi
    
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        error "Cliente frontend parou inesperadamente"
        echo "Verifique client.log para detalhes"
        break
    fi
    
    sleep 5
done

cleanup
