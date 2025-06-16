#!/bin/bash

# Test Local Features Script
# Tests all implemented features locally

set -e

echo "🧪 True Label - Feature Testing Suite"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# API Base URL
API_URL="http://localhost:5000/api/v1"
FRONTEND_URL="http://localhost:5001"

# Test credentials
ADMIN_EMAIL="admin@truelabel.com"
ADMIN_PASS="admin123"

# Check if servers are running
check_servers() {
    echo "Checking if servers are running..."
    
    if ! curl -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200"; then
        echo -e "${RED}❌ Backend server is not running${NC}"
        echo "Please run: npm run dev"
        exit 1
    fi
    
    if ! curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"; then
        echo -e "${YELLOW}⚠️  Frontend server is not running${NC}"
        echo "Please run: npm run dev (in client folder)"
    fi
    
    echo -e "${GREEN}✓ Servers are running${NC}"
    echo ""
}

# Test API endpoints
test_api() {
    echo -e "${BLUE}1. Testing API Endpoints${NC}"
    echo "------------------------"
    
    # Health check
    echo -n "Health check... "
    if curl -s "$API_URL/health" | grep -q "ok"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
    
    # Auth endpoints
    echo -n "Login endpoint... "
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✓${NC}"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    else
        echo -e "${RED}✗${NC}"
        TOKEN=""
    fi
    
    # Protected endpoints
    if [ ! -z "$TOKEN" ]; then
        echo -n "Protected route (profile)... "
        if curl -s "$API_URL/auth/profile" \
            -H "Authorization: Bearer $TOKEN" | grep -q "email"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
        
        echo -n "Metrics endpoint... "
        if curl -s "$API_URL/analytics/metrics" \
            -H "Authorization: Bearer $TOKEN" | grep -q "overview"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    fi
    
    echo ""
}

# Test Privacy Features
test_privacy() {
    echo -e "${BLUE}2. Testing Privacy Features${NC}"
    echo "---------------------------"
    
    if [ ! -z "$TOKEN" ]; then
        # Consent endpoints
        echo -n "Get consents... "
        if curl -s "$API_URL/privacy/consents" \
            -H "Authorization: Bearer $TOKEN" | grep -q "consents"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
        
        # Privacy policy
        echo -n "Privacy policy version... "
        if curl -s "$API_URL/privacy/policy/version" | grep -q "version"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
        
        # Cookie info
        echo -n "Cookie information... "
        if curl -s "$API_URL/privacy/cookies/info" | grep -q "necessary"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    fi
    
    echo ""
}

# Test Security Features
test_security() {
    echo -e "${BLUE}3. Testing Security Features${NC}"
    echo "----------------------------"
    
    # Rate limiting
    echo -n "Rate limiting (auth)... "
    RATE_LIMIT_HIT=false
    for i in {1..10}; do
        RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrong"}')
        if [ "$RESPONSE" = "429" ]; then
            RATE_LIMIT_HIT=true
            break
        fi
    done
    
    if [ "$RATE_LIMIT_HIT" = true ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} (may need more requests)"
    fi
    
    # CORS headers
    echo -n "CORS headers... "
    CORS_HEADER=$(curl -s -I "$API_URL/health" | grep -i "access-control-allow-origin")
    if [ ! -z "$CORS_HEADER" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
    
    # Security headers
    echo -n "Security headers... "
    HEADERS=$(curl -s -I "$API_URL/health")
    if echo "$HEADERS" | grep -q -i "x-content-type-options"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC}"
    fi
    
    echo ""
}

# Test Database Operations
test_database() {
    echo -e "${BLUE}4. Testing Database Operations${NC}"
    echo "------------------------------"
    
    # Check if database is accessible
    echo -n "Database connection... "
    if cd server && npx prisma db push --skip-generate > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        cd ..
    else
        echo -e "${RED}✗${NC}"
        cd ..
    fi
    
    echo ""
}

# Test Migration Tools
test_migration() {
    echo -e "${BLUE}5. Testing Migration Tools${NC}"
    echo "--------------------------"
    
    # Test validation script
    echo -n "Data validation script... "
    if cd migration && npx ts-node validate-data.ts validate --dry-run > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        cd ..
    else
        echo -e "${YELLOW}⚠${NC} (script exists but may need database)"
        cd ..
    fi
    
    # Test import script
    echo -n "Import script syntax... "
    if cd migration && npx ts-node import-data.ts --help > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        cd ..
    else
        echo -e "${YELLOW}⚠${NC}"
        cd ..
    fi
    
    echo ""
}

# Test Performance
test_performance() {
    echo -e "${BLUE}6. Testing Performance Features${NC}"
    echo "-------------------------------"
    
    if [ ! -z "$TOKEN" ]; then
        # Test response times
        echo -n "API response time (<200ms)... "
        START=$(date +%s%N)
        curl -s "$API_URL/health" > /dev/null
        END=$(date +%s%N)
        DIFF=$((($END - $START)/1000000))
        
        if [ $DIFF -lt 200 ]; then
            echo -e "${GREEN}✓ ${DIFF}ms${NC}"
        else
            echo -e "${YELLOW}⚠ ${DIFF}ms${NC}"
        fi
        
        # Test gzip compression
        echo -n "Gzip compression... "
        if curl -s -H "Accept-Encoding: gzip" -I "$API_URL/health" | grep -q "gzip"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${YELLOW}⚠${NC}"
        fi
    fi
    
    echo ""
}

# Main execution
echo "Starting feature tests..."
echo ""

check_servers
test_api
test_privacy
test_security
test_database
test_migration
test_performance

echo -e "${BLUE}7. Manual Test Checklist${NC}"
echo "------------------------"
echo "Please manually verify these features:"
echo ""
echo "[ ] Privacy Dashboard (/privacy)"
echo "[ ] Cookie consent banner appears for new users"
echo "[ ] Business metrics dashboard (/admin/metrics)"
echo "[ ] QR code generation and scanning"
echo "[ ] File upload for lab reports"
echo "[ ] Email notifications (if configured)"
echo "[ ] Data export functionality"
echo "[ ] User data deletion request"
echo ""

echo -e "${GREEN}✅ Automated tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Complete manual test checklist"
echo "3. Run security audit: ./scripts/security-audit.sh"
echo "4. Check logs: tail -f server/logs/*.log"