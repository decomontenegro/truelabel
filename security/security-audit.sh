#!/bin/bash
# Comprehensive Security Audit Script for True Label

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIT_DATE=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="security-audit-report-${AUDIT_DATE}.md"

# Initialize report
cat > $REPORT_FILE << EOF
# Security Audit Report - True Label
**Date:** $(date)
**Environment:** Production

## Executive Summary
This report contains the results of a comprehensive security audit for the True Label platform.

---

EOF

# Function to add finding to report
add_finding() {
    local severity=$1
    local category=$2
    local description=$3
    local recommendation=$4
    
    echo "### $severity: $category" >> $REPORT_FILE
    echo "**Description:** $description" >> $REPORT_FILE
    echo "**Recommendation:** $recommendation" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
}

# Function to check command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${YELLOW}Warning: $1 not installed. Skipping related checks.${NC}"
        return 1
    fi
    return 0
}

echo -e "${BLUE}Starting Security Audit...${NC}"
echo ""

# 1. Dependency Scanning
echo -e "${BLUE}1. Dependency Security Scan${NC}"
echo "## 1. Dependency Security" >> $REPORT_FILE

# Frontend dependencies
echo "Scanning frontend dependencies..."
cd "$PROJECT_ROOT/client"
if npm audit --json > /tmp/npm-audit-client.json 2>/dev/null; then
    vulnerabilities=$(jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0)) | length' /tmp/npm-audit-client.json)
    if [ "$vulnerabilities" -gt 0 ]; then
        echo -e "${RED}✗ Found vulnerabilities in frontend dependencies${NC}"
        add_finding "HIGH" "Frontend Dependencies" \
            "Found $vulnerabilities vulnerabilities in npm packages" \
            "Run 'npm audit fix' to fix automatically fixable issues"
    else
        echo -e "${GREEN}✓ No vulnerabilities in frontend dependencies${NC}"
    fi
else
    echo -e "${YELLOW}⚠ npm audit failed for frontend${NC}"
fi

# Backend dependencies
echo "Scanning backend dependencies..."
cd "$PROJECT_ROOT/server"
if npm audit --json > /tmp/npm-audit-server.json 2>/dev/null; then
    vulnerabilities=$(jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0)) | length' /tmp/npm-audit-server.json)
    if [ "$vulnerabilities" -gt 0 ]; then
        echo -e "${RED}✗ Found vulnerabilities in backend dependencies${NC}"
        add_finding "HIGH" "Backend Dependencies" \
            "Found $vulnerabilities vulnerabilities in npm packages" \
            "Run 'npm audit fix' to fix automatically fixable issues"
    else
        echo -e "${GREEN}✓ No vulnerabilities in backend dependencies${NC}"
    fi
else
    echo -e "${YELLOW}⚠ npm audit failed for backend${NC}"
fi

# 2. Code Security Analysis
echo ""
echo -e "${BLUE}2. Code Security Analysis${NC}"
echo "## 2. Code Security Analysis" >> $REPORT_FILE

# Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
cd "$PROJECT_ROOT"
if check_command "gitleaks"; then
    if gitleaks detect --no-git --verbose > /tmp/gitleaks-report.txt 2>&1; then
        echo -e "${GREEN}✓ No secrets found in codebase${NC}"
    else
        echo -e "${RED}✗ Potential secrets found in codebase${NC}"
        add_finding "CRITICAL" "Hardcoded Secrets" \
            "Found potential secrets in source code" \
            "Remove all secrets and use environment variables or secret management"
    fi
fi

# Check for common security patterns
echo "Checking for security anti-patterns..."
security_issues=0

# SQL Injection patterns
if grep -r "query.*\${.*}" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v "prisma" > /dev/null; then
    echo -e "${RED}✗ Potential SQL injection vulnerabilities${NC}"
    add_finding "CRITICAL" "SQL Injection" \
        "Found string concatenation in database queries" \
        "Use parameterized queries or ORM (Prisma) exclusively"
    ((security_issues++))
fi

# XSS patterns
if grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${YELLOW}⚠ Found dangerouslySetInnerHTML usage${NC}"
    add_finding "MEDIUM" "XSS Risk" \
        "Usage of dangerouslySetInnerHTML detected" \
        "Ensure all content is properly sanitized before rendering"
    ((security_issues++))
fi

# Eval usage
if grep -r "eval(" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${RED}✗ Found eval() usage${NC}"
    add_finding "HIGH" "Code Injection" \
        "eval() function usage detected" \
        "Remove eval() and use safer alternatives"
    ((security_issues++))
fi

if [ $security_issues -eq 0 ]; then
    echo -e "${GREEN}✓ No major security anti-patterns found${NC}"
fi

# 3. Authentication & Authorization
echo ""
echo -e "${BLUE}3. Authentication & Authorization${NC}"
echo "## 3. Authentication & Authorization" >> $REPORT_FILE

# Check JWT implementation
echo "Checking JWT implementation..."
jwt_issues=0

# Check for JWT secret strength
if grep -r "JWT_SECRET.*=.*[\"'].*[\"']" --include="*.env*" . 2>/dev/null | grep -v example > /dev/null; then
    secret_length=$(grep -r "JWT_SECRET" --include="*.env*" . 2>/dev/null | grep -v example | head -1 | awk -F= '{print $2}' | tr -d '"' | tr -d "'" | wc -c)
    if [ $secret_length -lt 32 ]; then
        echo -e "${RED}✗ JWT secret too short${NC}"
        add_finding "HIGH" "Weak JWT Secret" \
            "JWT secret is less than 32 characters" \
            "Use a strong, randomly generated secret of at least 64 characters"
        ((jwt_issues++))
    fi
fi

# Check token expiration
if grep -r "expiresIn.*:.*[\"']never[\"']" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${RED}✗ JWT tokens never expire${NC}"
    add_finding "HIGH" "Token Expiration" \
        "JWT tokens are set to never expire" \
        "Set appropriate expiration times (e.g., 1h for access tokens)"
    ((jwt_issues++))
fi

if [ $jwt_issues -eq 0 ]; then
    echo -e "${GREEN}✓ JWT implementation appears secure${NC}"
fi

# Check password policies
echo "Checking password policies..."
if ! grep -r "minLength.*:.*8" --include="*.ts" . 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${YELLOW}⚠ No minimum password length enforcement found${NC}"
    add_finding "MEDIUM" "Password Policy" \
        "No explicit minimum password length found" \
        "Enforce minimum 8 characters with complexity requirements"
fi

# 4. API Security
echo ""
echo -e "${BLUE}4. API Security${NC}"
echo "## 4. API Security" >> $REPORT_FILE

# Check CORS configuration
echo "Checking CORS configuration..."
if grep -r "origin.*:.*true" --include="*.ts" --include="*.js" server/ 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${RED}✗ CORS allows all origins${NC}"
    add_finding "HIGH" "CORS Misconfiguration" \
        "CORS is configured to allow all origins" \
        "Restrict CORS to specific allowed domains"
fi

# Check rate limiting
echo "Checking rate limiting..."
if ! grep -r "rateLimit" --include="*.ts" server/src 2>/dev/null > /dev/null; then
    echo -e "${YELLOW}⚠ No rate limiting found${NC}"
    add_finding "MEDIUM" "Rate Limiting" \
        "No rate limiting middleware detected" \
        "Implement rate limiting for all API endpoints"
else
    echo -e "${GREEN}✓ Rate limiting implemented${NC}"
fi

# 5. Infrastructure Security
echo ""
echo -e "${BLUE}5. Infrastructure Security${NC}"
echo "## 5. Infrastructure Security" >> $REPORT_FILE

# Check Terraform security
echo "Checking Terraform configurations..."
cd "$PROJECT_ROOT/infrastructure/terraform"

# Check for public S3 buckets
if grep -r "acl.*=.*[\"']public" . 2>/dev/null | grep -v ".terraform" > /dev/null; then
    echo -e "${RED}✗ Public S3 buckets configured${NC}"
    add_finding "CRITICAL" "Public S3 Buckets" \
        "S3 buckets configured with public ACL" \
        "Make all S3 buckets private and use CloudFront for public access"
fi

# Check for open security groups
if grep -r "cidr_blocks.*=.*\[.*0.0.0.0/0" . 2>/dev/null | grep -v ".terraform" | grep -v "alb" > /dev/null; then
    echo -e "${YELLOW}⚠ Security groups with 0.0.0.0/0 access${NC}"
    add_finding "HIGH" "Open Security Groups" \
        "Security groups allow access from any IP" \
        "Restrict security group rules to specific IPs or ranges"
fi

# Check encryption
if ! grep -r "encrypted.*=.*true" . 2>/dev/null | grep -v ".terraform" > /dev/null; then
    echo -e "${RED}✗ Some resources may not be encrypted${NC}"
    add_finding "HIGH" "Encryption at Rest" \
        "Not all resources have encryption enabled" \
        "Enable encryption for all data stores (RDS, S3, EBS)"
fi

# 6. Data Protection
echo ""
echo -e "${BLUE}6. Data Protection${NC}"
echo "## 6. Data Protection" >> $REPORT_FILE

# Check for PII handling
echo "Checking PII handling..."
if grep -r "console.log.*email\|password\|cpf\|phone" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules > /dev/null; then
    echo -e "${RED}✗ PII potentially logged to console${NC}"
    add_finding "HIGH" "PII Exposure" \
        "Personal data may be logged to console" \
        "Remove all PII from logs and implement proper data masking"
fi

# Check database field encryption
if ! grep -r "@encrypted" --include="*.prisma" . 2>/dev/null > /dev/null; then
    echo -e "${YELLOW}⚠ No field-level encryption found${NC}"
    add_finding "MEDIUM" "Field Encryption" \
        "Sensitive fields are not individually encrypted" \
        "Implement field-level encryption for sensitive data (PII, financial)"
fi

# 7. SSL/TLS Configuration
echo ""
echo -e "${BLUE}7. SSL/TLS Configuration${NC}"
echo "## 7. SSL/TLS Configuration" >> $REPORT_FILE

# Check TLS versions
if grep -r "TLSv1.0\|TLSv1.1" --include="*.tf" --include="*.conf" . 2>/dev/null | grep -v ".terraform" > /dev/null; then
    echo -e "${RED}✗ Weak TLS versions supported${NC}"
    add_finding "HIGH" "Weak TLS" \
        "TLS 1.0 or 1.1 is supported" \
        "Disable TLS versions below 1.2"
fi

# 8. Logging and Monitoring
echo ""
echo -e "${BLUE}8. Logging and Monitoring${NC}"
echo "## 8. Logging and Monitoring" >> $REPORT_FILE

# Check for security event logging
if ! grep -r "failed.*login\|unauthorized\|forbidden" --include="*.ts" server/src 2>/dev/null > /dev/null; then
    echo -e "${YELLOW}⚠ Security event logging not found${NC}"
    add_finding "MEDIUM" "Security Logging" \
        "No explicit security event logging found" \
        "Implement comprehensive security event logging"
fi

# 9. Third-party Integrations
echo ""
echo -e "${BLUE}9. Third-party Integrations${NC}"
echo "## 9. Third-party Integrations" >> $REPORT_FILE

# Check API key storage
if grep -r "apiKey.*=.*[\"'][A-Za-z0-9]" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v ".env" > /dev/null; then
    echo -e "${RED}✗ Hardcoded API keys found${NC}"
    add_finding "CRITICAL" "Hardcoded API Keys" \
        "API keys are hardcoded in source files" \
        "Move all API keys to environment variables"
fi

# 10. OWASP Top 10 Check
echo ""
echo -e "${BLUE}10. OWASP Top 10 Coverage${NC}"
echo "## 10. OWASP Top 10 Coverage" >> $REPORT_FILE

owasp_checks=(
    "Broken Access Control:Role-based access control implementation"
    "Cryptographic Failures:Encryption and hashing practices"
    "Injection:Input validation and parameterized queries"
    "Insecure Design:Security by design principles"
    "Security Misconfiguration:Default configurations and error handling"
    "Vulnerable Components:Dependency management"
    "Authentication Failures:Strong authentication mechanisms"
    "Data Integrity Failures:Input validation and serialization"
    "Security Logging Failures:Comprehensive logging and monitoring"
    "SSRF:URL validation and whitelisting"
)

for check in "${owasp_checks[@]}"; do
    echo "- $check" >> $REPORT_FILE
done

# Generate Summary
echo ""
echo -e "${BLUE}Generating Summary...${NC}"
echo "" >> $REPORT_FILE
echo "## Summary and Recommendations" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### Priority Actions:" >> $REPORT_FILE
echo "1. Address all CRITICAL findings immediately" >> $REPORT_FILE
echo "2. Implement comprehensive security headers" >> $REPORT_FILE
echo "3. Enable security monitoring and alerting" >> $REPORT_FILE
echo "4. Conduct regular security audits" >> $REPORT_FILE
echo "5. Implement security training for development team" >> $REPORT_FILE

# Display summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Security Audit Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the full report"
echo "2. Create tickets for each finding"
echo "3. Prioritize based on severity"
echo "4. Implement fixes starting with CRITICAL issues"