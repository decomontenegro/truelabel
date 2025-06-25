#!/bin/bash

# Complete Local Testing Script
# Tests the entire True Label application locally

set -e

echo "🚀 True Label - Complete Local Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
BACKEND_PORT=5000
FRONTEND_PORT=5001
API_URL="http://localhost:$BACKEND_PORT/api/v1"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "----------------------------------------"
}

test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TOTAL_TESTS++))
    ((PASSED_TESTS++))
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TOTAL_TESTS++))
    ((FAILED_TESTS++))
}

test_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        test_pass "Node.js installed ($NODE_VERSION)"
    else
        test_fail "Node.js not installed"
        exit 1
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        test_pass "npm installed (v$NPM_VERSION)"
    else
        test_fail "npm not installed"
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ -d "node_modules" ] && [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
        test_pass "Dependencies installed"
    else
        test_warn "Dependencies not fully installed"
        echo "  Running: npm run install:all"
        npm run install:all
    fi
}

# Start servers
start_servers() {
    print_section "Starting Development Servers"
    
    # Kill any existing processes on our ports
    echo "Cleaning up existing processes..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
    
    # Start backend
    echo "Starting backend server..."
    cd server
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo "Starting frontend server..."
    cd client
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for servers to start
    echo -n "Waiting for servers to start"
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200" && \
           curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"; then
            echo ""
            test_pass "Servers started successfully"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if [ $i -eq 30 ]; then
        echo ""
        test_fail "Servers failed to start"
        echo "Backend log tail:"
        tail -n 20 backend.log
        echo "Frontend log tail:"
        tail -n 20 frontend.log
        cleanup_and_exit 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_section "Testing API Endpoints"
    
    # Health check
    if curl -s "$API_URL/health" | grep -q "ok"; then
        test_pass "Health check endpoint"
    else
        test_fail "Health check endpoint"
    fi
    
    # Auth endpoints
    REGISTER_DATA='{
        "email": "test'$(date +%s)'@example.com",
        "password": "Test123!@#",
        "name": "Test User",
        "role": "BRAND",
        "acceptTerms": true
    }'
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "$REGISTER_DATA")
    
    if echo "$RESPONSE" | grep -q "token"; then
        test_pass "User registration"
        TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        
        # Test protected endpoint
        if curl -s "$API_URL/auth/profile" \
            -H "Authorization: Bearer $TOKEN" | grep -q "email"; then
            test_pass "Protected route access"
        else
            test_fail "Protected route access"
        fi
    else
        test_fail "User registration"
    fi
    
    # Test validation endpoint
    if curl -s "$API_URL/public/validate/test-qr-code" | grep -q "error\|product"; then
        test_pass "Public validation endpoint"
    else
        test_fail "Public validation endpoint"
    fi
}

# Test frontend
test_frontend() {
    print_section "Testing Frontend"
    
    # Check if frontend loads
    if curl -s "$FRONTEND_URL" | grep -q "True Label"; then
        test_pass "Frontend loads successfully"
    else
        test_fail "Frontend loads successfully"
    fi
    
    # Check static assets
    if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/vite.svg" | grep -q "200"; then
        test_pass "Static assets accessible"
    else
        test_fail "Static assets accessible"
    fi
}

# Test database
test_database() {
    print_section "Testing Database"
    
    cd server
    
    # Test Prisma schema
    if npx prisma validate > /dev/null 2>&1; then
        test_pass "Prisma schema valid"
    else
        test_fail "Prisma schema valid"
    fi
    
    # Test database connection
    if npx prisma db push --skip-generate > /dev/null 2>&1; then
        test_pass "Database connection successful"
    else
        test_fail "Database connection successful"
    fi
    
    cd ..
}

# Test security features
test_security() {
    print_section "Testing Security Features"
    
    # Test rate limiting
    echo -n "Testing rate limiting... "
    RATE_LIMITED=false
    for i in {1..10}; do
        RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrong"}')
        if [ "$RESPONSE" = "429" ]; then
            RATE_LIMITED=true
            break
        fi
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        test_pass "Rate limiting active"
    else
        test_warn "Rate limiting not triggered (may need more requests)"
    fi
    
    # Test CORS headers
    CORS_HEADER=$(curl -s -I "$API_URL/health" | grep -i "access-control-allow-origin")
    if [ ! -z "$CORS_HEADER" ]; then
        test_pass "CORS headers present"
    else
        test_fail "CORS headers present"
    fi
    
    # Test security headers
    HEADERS=$(curl -s -I "$API_URL/health")
    SECURITY_HEADERS=0
    
    echo "$HEADERS" | grep -qi "x-content-type-options" && ((SECURITY_HEADERS++))
    echo "$HEADERS" | grep -qi "x-frame-options" && ((SECURITY_HEADERS++))
    echo "$HEADERS" | grep -qi "x-xss-protection" && ((SECURITY_HEADERS++))
    
    if [ $SECURITY_HEADERS -ge 2 ]; then
        test_pass "Security headers ($SECURITY_HEADERS found)"
    else
        test_warn "Security headers (only $SECURITY_HEADERS found)"
    fi
}

# Test privacy features
test_privacy() {
    print_section "Testing Privacy Features"
    
    # Test privacy endpoints
    if curl -s "$API_URL/privacy/policy/version" | grep -q "version"; then
        test_pass "Privacy policy endpoint"
    else
        test_fail "Privacy policy endpoint"
    fi
    
    if curl -s "$API_URL/privacy/cookies/info" | grep -q "necessary"; then
        test_pass "Cookie information endpoint"
    else
        test_fail "Cookie information endpoint"
    fi
}

# Test build process
test_build() {
    print_section "Testing Build Process"
    
    # Test backend build
    echo -n "Building backend... "
    if cd server && npm run build > /dev/null 2>&1; then
        test_pass "Backend builds successfully"
        cd ..
    else
        test_fail "Backend builds successfully"
        cd ..
    fi
    
    # Test frontend build
    echo -n "Building frontend... "
    if cd client && npm run build > /dev/null 2>&1; then
        test_pass "Frontend builds successfully"
        cd ..
    else
        test_fail "Frontend builds successfully"
        cd ..
    fi
}

# Performance test
test_performance() {
    print_section "Testing Performance"
    
    # API response time
    START=$(date +%s%N)
    curl -s "$API_URL/health" > /dev/null
    END=$(date +%s%N)
    RESPONSE_TIME=$((($END - $START)/1000000))
    
    if [ $RESPONSE_TIME -lt 100 ]; then
        test_pass "API response time (${RESPONSE_TIME}ms)"
    elif [ $RESPONSE_TIME -lt 500 ]; then
        test_warn "API response time (${RESPONSE_TIME}ms)"
    else
        test_fail "API response time (${RESPONSE_TIME}ms)"
    fi
    
    # Check if compression is enabled
    if curl -s -H "Accept-Encoding: gzip" -I "$API_URL/health" | grep -qi "content-encoding.*gzip"; then
        test_pass "Gzip compression enabled"
    else
        test_warn "Gzip compression not detected"
    fi
}

# Cleanup function
cleanup_and_exit() {
    echo ""
    echo "Cleaning up..."
    
    # Kill server processes
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    
    # Clean up log files
    rm -f backend.log frontend.log
    
    exit $1
}

# Main execution
main() {
    # Trap to ensure cleanup on exit
    trap 'cleanup_and_exit 1' INT TERM
    
    echo "Starting comprehensive local testing..."
    echo "This will test all aspects of the True Label application"
    echo ""
    
    # Run all tests
    check_prerequisites
    start_servers
    test_api_endpoints
    test_frontend
    test_database
    test_security
    test_privacy
    test_performance
    test_build
    
    # Print summary
    echo ""
    echo -e "${PURPLE}========================================"
    echo "           TEST SUMMARY"
    echo "========================================${NC}"
    echo ""
    echo -e "Total Tests:  ${TOTAL_TESTS}"
    echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed! The application is ready for use.${NC}"
        echo ""
        echo "You can access:"
        echo "  - Frontend: $FRONTEND_URL"
        echo "  - API: $API_URL"
        echo "  - API Docs: $API_URL/docs"
        echo ""
        echo "Test credentials:"
        echo "  - Admin: admin@truelabel.com / admin123"
        echo "  - Brand: marca@exemplo.com / marca123"
        cleanup_and_exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
        echo ""
        echo "Check the logs:"
        echo "  - Backend: tail -f server/logs/app.log"
        echo "  - Frontend: Check browser console"
        cleanup_and_exit 1
    fi
}

# Run main function
main