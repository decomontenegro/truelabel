#!/bin/bash

# 🧪 Script para Testar o Backend do True Label

echo "🧪 Testando Backend do True Label..."
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

# Função para testar endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    info "Testando: $description"
    echo "URL: $url"
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" = "$expected_status" ]; then
            success "$description - Status: $status_code"
            if [ ! -z "$body" ]; then
                echo "Resposta: $body" | head -c 200
                echo ""
            fi
        else
            error "$description - Status: $status_code (esperado: $expected_status)"
        fi
    else
        warning "curl não disponível - teste manual necessário"
        echo "Abra no browser: $url"
    fi
    echo ""
}

echo ""
info "1. Verificando se o backend está rodando..."

# Verificar se a porta 3000 está em uso
if command -v lsof &> /dev/null; then
    if lsof -i :3000 &> /dev/null; then
        success "Processo rodando na porta 3000"
        lsof -i :3000
    else
        error "Nenhum processo na porta 3000"
        echo "Execute: cd server && npm run dev"
        exit 1
    fi
else
    warning "lsof não disponível - verificação manual necessária"
fi

echo ""
info "2. Testando endpoints básicos..."

# Health check
test_endpoint "http://localhost:3000/health" "Health Check"

# API base
test_endpoint "http://localhost:3000/api/v1" "API Base"

# Auth endpoint (deve retornar 400 ou 401 sem dados)
test_endpoint "http://localhost:3000/api/v1/auth/login" "Login Endpoint" "400"

echo ""
info "3. Testando endpoints com dados..."

# Teste de login com dados válidos
if command -v curl &> /dev/null; then
    info "Testando login com credenciais de teste..."
    
    login_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@truelabel.com","password":"admin123"}' \
        "http://localhost:3000/api/v1/auth/login" 2>/dev/null)
    
    login_status=$(echo "$login_response" | tail -n1)
    login_body=$(echo "$login_response" | head -n -1)
    
    if [ "$login_status" = "200" ]; then
        success "Login funcionando - Status: $login_status"
        echo "Token recebido: $(echo "$login_body" | head -c 100)..."
        
        # Extrair token para testes subsequentes
        TOKEN=$(echo "$login_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        if [ ! -z "$TOKEN" ]; then
            success "Token extraído com sucesso"
            
            # Testar endpoint autenticado
            info "Testando endpoint autenticado..."
            auth_response=$(curl -s -w "\n%{http_code}" \
                -H "Authorization: Bearer $TOKEN" \
                "http://localhost:3000/api/v1/users/me" 2>/dev/null)
            
            auth_status=$(echo "$auth_response" | tail -n1)
            
            if [ "$auth_status" = "200" ]; then
                success "Autenticação funcionando - Status: $auth_status"
            else
                warning "Problema na autenticação - Status: $auth_status"
            fi
        fi
    else
        error "Login falhou - Status: $login_status"
        echo "Resposta: $login_body"
    fi
fi

echo ""
info "4. Testando outros endpoints importantes..."

# Produtos
test_endpoint "http://localhost:3000/api/v1/products" "Produtos" "401"

# Laboratórios
test_endpoint "http://localhost:3000/api/v1/laboratories" "Laboratórios" "401"

# Validações
test_endpoint "http://localhost:3000/api/v1/validations" "Validações" "401"

echo ""
info "5. Verificando logs do servidor..."

if [ -f "../backend.log" ]; then
    info "Últimas linhas do log do backend:"
    tail -10 ../backend.log
elif [ -f "backend.log" ]; then
    info "Últimas linhas do log do backend:"
    tail -10 backend.log
else
    warning "Log do backend não encontrado"
fi

echo ""
info "6. Resumo dos testes..."

echo ""
success "🎯 Testes concluídos!"
echo ""
echo "📋 Para verificar manualmente:"
echo "   Health Check: http://localhost:3000/health"
echo "   API Docs: http://localhost:3000/api/v1"
echo ""
echo "🔧 Se houver problemas:"
echo "   1. Verifique se o servidor está rodando: lsof -i :3000"
echo "   2. Verifique os logs: tail -f backend.log"
echo "   3. Reinicie o servidor: npm run dev"
echo ""
echo "👥 Credenciais de teste:"
echo "   Admin: admin@truelabel.com / admin123"
echo "   Brand: marca@exemplo.com / marca123"
echo "   Lab: analista@labexemplo.com / lab123"
echo ""
