#!/bin/bash

# Test Local Infrastructure Script
# Tests all critical components locally before production deployment

set -e

echo "🚀 True Label - Local Infrastructure Test Suite"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

# Warning function
check_warning() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Checking $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARNINGS++))
    fi
}

echo "1. Environment Configuration"
echo "----------------------------"

# Check environment files
run_test ".env.production.example exists" "[ -f .env.production.example ]"
run_test "PM2 ecosystem config exists" "[ -f ecosystem.config.js ]"
run_test "Nginx config exists" "[ -f nginx/truelabel.conf ]"
run_test "Docker config exists" "[ -f docker-compose.yml ]"

echo ""
echo "2. Backend Services"
echo "-------------------"

# Check backend structure
run_test "Queue processor exists" "[ -f server/src/workers/queue-processor.ts ]"
run_test "Cron jobs exist" "[ -f server/src/workers/cron-jobs.ts ]"
run_test "Security middleware exists" "[ -f server/src/middleware/security.ts ]"
run_test "Privacy service exists" "[ -f server/src/services/privacy.service.ts ]"
run_test "Metrics service exists" "[ -f server/src/services/metrics.service.ts ]"

echo ""
echo "3. Performance Optimizations"
echo "----------------------------"

# Check performance features
run_test "Vite config optimized" "grep -q 'rollupOptions' client/vite.config.ts"
run_test "Performance utils exist" "[ -f server/src/utils/performance.ts ]"
run_test "Cache utils exist" "[ -f server/src/utils/cache.ts ]"

echo ""
echo "4. Security Features"
echo "--------------------"

# Check security implementations
run_test "WAF rules exist" "[ -f infrastructure/terraform/waf.tf ]"
run_test "Security audit script exists" "[ -f scripts/security-audit.sh ]"
run_test "Rate limiting configured" "grep -q 'rateLimit' server/src/middleware/security.ts"
run_test "CORS configured" "grep -q 'cors' server/src/middleware/security.ts"

echo ""
echo "5. LGPD Compliance"
echo "------------------"

# Check LGPD features
run_test "Privacy routes exist" "[ -f server/src/routes/privacy.ts ]"
run_test "Privacy dashboard exists" "[ -f client/src/pages/PrivacyDashboard.tsx ]"
run_test "Consent banner exists" "[ -f client/src/components/privacy/ConsentBanner.tsx ]"
run_test "Data cleanup job exists" "[ -f server/src/jobs/data-cleanup.job.ts ]"

echo ""
echo "6. Infrastructure as Code"
echo "-------------------------"

# Check Terraform files
run_test "Terraform main config" "[ -f infrastructure/terraform/main.tf ]"
run_test "VPC configuration" "[ -f infrastructure/terraform/vpc.tf ]"
run_test "ECS configuration" "[ -f infrastructure/terraform/ecs.tf ]"
run_test "RDS configuration" "[ -f infrastructure/terraform/rds.tf ]"
run_test "Auto-scaling config" "[ -f infrastructure/terraform/auto-scaling.tf ]"

echo ""
echo "7. CI/CD Pipeline"
echo "-----------------"

# Check GitHub Actions
run_test "CI workflow exists" "[ -f .github/workflows/ci.yml ]"
run_test "Deploy workflow exists" "[ -f .github/workflows/deploy.yml ]"
run_test "Security scan workflow" "[ -f .github/workflows/security.yml ]"

echo ""
echo "8. Migration Tools"
echo "------------------"

# Check migration scripts
run_test "Import data script" "[ -f migration/import-data.ts ]"
run_test "Validate data script" "[ -f migration/validate-data.ts ]"
run_test "Rollback script" "[ -f migration/rollback.ts ]"

echo ""
echo "9. Monitoring & Metrics"
echo "-----------------------"

# Check monitoring features
run_test "Metrics dashboard exists" "[ -f client/src/pages/admin/BusinessMetrics.tsx ]"
run_test "Monitoring scripts exist" "[ -f scripts/monitor.sh ]"
run_test "Backup scripts exist" "[ -f scripts/backup.sh ]"

echo ""
echo "10. Local Development Test"
echo "--------------------------"

# Test local services
echo "Starting local services test..."

# Check if backend can compile
echo -n "Backend TypeScript compilation... "
if cd server && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    cd ..
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    cd ..
fi

# Check if frontend can build
echo -n "Frontend build test... "
if cd client && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    cd ..
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    cd ..
fi

# Check TypeScript types
echo -n "TypeScript type checking... "
if cd server && npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    cd ..
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    ((WARNINGS++))
    cd ..
fi

echo ""
echo "11. Database Migration Test"
echo "---------------------------"

# Check Prisma
echo -n "Prisma schema validation... "
if cd server && npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    cd ..
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    cd ..
fi

echo ""
echo "=============================================="
echo "Test Summary"
echo "=============================================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev (to start development servers)"
    echo "2. Run: ./test-local-features.sh (to test features)"
    echo "3. Run: ./scripts/security-audit.sh (for security check)"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues before proceeding.${NC}"
    exit 1
fi