#!/bin/bash
# DNS Verification Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-"truelabel.com.br"}
EXPECTED_NAMESERVERS=("ns1.cloudflare.com" "ns2.cloudflare.com")

echo -e "${GREEN}DNS Configuration Verification${NC}"
echo -e "${GREEN}==============================${NC}"
echo "Domain: ${DOMAIN}"
echo ""

# Function to check DNS record
check_dns_record() {
    local record_type=$1
    local record_name=$2
    local expected_value=$3
    
    echo -n "Checking ${record_type} record for ${record_name}... "
    
    result=$(dig +short ${record_type} ${record_name} @8.8.8.8 2>/dev/null)
    
    if [ -z "$result" ]; then
        echo -e "${RED}✗ Not found${NC}"
        return 1
    elif [ -n "$expected_value" ] && [[ "$result" != *"$expected_value"* ]]; then
        echo -e "${YELLOW}⚠ Found: $result (expected: $expected_value)${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $result${NC}"
        return 0
    fi
}

# Function to check SSL certificate
check_ssl_cert() {
    local hostname=$1
    
    echo -n "Checking SSL certificate for ${hostname}... "
    
    cert_info=$(echo | openssl s_client -servername ${hostname} -connect ${hostname}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -z "$cert_info" ]; then
        echo -e "${RED}✗ No certificate found${NC}"
        return 1
    fi
    
    # Check expiration
    not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    expiry_epoch=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$not_after" +%s 2>/dev/null || date -d "$not_after" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ $days_until_expiry -lt 30 ]; then
        echo -e "${YELLOW}⚠ Expires in ${days_until_expiry} days${NC}"
    else
        echo -e "${GREEN}✓ Valid for ${days_until_expiry} days${NC}"
    fi
}

# Function to test HTTP/HTTPS redirect
check_https_redirect() {
    local url=$1
    
    echo -n "Checking HTTPS redirect for ${url}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}:%{redirect_url}" -L --max-redirs 0 "http://${url}" 2>/dev/null)
    http_code=$(echo $response | cut -d: -f1)
    redirect_url=$(echo $response | cut -d: -f2-)
    
    if [[ "$http_code" == "301" || "$http_code" == "302" ]] && [[ "$redirect_url" == https://* ]]; then
        echo -e "${GREEN}✓ Redirects to HTTPS${NC}"
    else
        echo -e "${RED}✗ No HTTPS redirect (HTTP ${http_code})${NC}"
    fi
}

# Function to check response time
check_response_time() {
    local url=$1
    
    echo -n "Checking response time for ${url}... "
    
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://${url}" 2>/dev/null)
    
    if [ -z "$response_time" ]; then
        echo -e "${RED}✗ Failed to connect${NC}"
        return 1
    fi
    
    # Convert to milliseconds
    response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
    
    if [ $response_ms -lt 500 ]; then
        echo -e "${GREEN}✓ ${response_ms}ms${NC}"
    elif [ $response_ms -lt 1000 ]; then
        echo -e "${YELLOW}⚠ ${response_ms}ms (slow)${NC}"
    else
        echo -e "${RED}✗ ${response_ms}ms (very slow)${NC}"
    fi
}

# Check nameservers
echo "1. Nameserver Configuration"
echo "============================"
current_ns=$(dig +short NS ${DOMAIN} @8.8.8.8 | sort)
expected_ns=$(printf '%s\n' "${EXPECTED_NAMESERVERS[@]}" | sort)

if [ "$current_ns" = "$expected_ns" ]; then
    echo -e "${GREEN}✓ Nameservers correctly configured${NC}"
else
    echo -e "${RED}✗ Nameserver mismatch${NC}"
    echo "Current: $current_ns"
    echo "Expected: $expected_ns"
fi
echo ""

# Check A/CNAME records
echo "2. DNS Records"
echo "=============="
check_dns_record "A" "${DOMAIN}"
check_dns_record "CNAME" "www.${DOMAIN}"
check_dns_record "CNAME" "api.${DOMAIN}"
echo ""

# Check MX records
echo "3. Email Configuration"
echo "====================="
check_dns_record "MX" "${DOMAIN}"
check_dns_record "TXT" "${DOMAIN}" "v=spf1"
check_dns_record "TXT" "_dmarc.${DOMAIN}" "v=DMARC1"
echo ""

# Check SSL certificates
echo "4. SSL Certificates"
echo "=================="
check_ssl_cert "${DOMAIN}"
check_ssl_cert "www.${DOMAIN}"
check_ssl_cert "api.${DOMAIN}"
echo ""

# Check HTTPS redirects
echo "5. HTTPS Configuration"
echo "====================="
check_https_redirect "${DOMAIN}"
check_https_redirect "www.${DOMAIN}"
echo ""

# Check response times
echo "6. Performance"
echo "============="
check_response_time "${DOMAIN}"
check_response_time "api.${DOMAIN}/health"
echo ""

# Check CAA records
echo "7. Security Records"
echo "=================="
check_dns_record "CAA" "${DOMAIN}"
echo ""

# Cloudflare-specific checks
echo "8. Cloudflare Configuration"
echo "=========================="
echo -n "Checking Cloudflare proxy status... "
cf_proxied=$(dig +short ${DOMAIN} | grep -c "cloudflare" || true)
if [ $cf_proxied -gt 0 ]; then
    echo -e "${GREEN}✓ Proxied through Cloudflare${NC}"
else
    echo -e "${YELLOW}⚠ Not proxied through Cloudflare${NC}"
fi

# Check HTTP headers
echo ""
echo "9. Security Headers"
echo "=================="
headers=$(curl -s -I "https://${DOMAIN}" 2>/dev/null)

check_header() {
    local header=$1
    echo -n "Checking ${header}... "
    if echo "$headers" | grep -i "^${header}:" > /dev/null; then
        echo -e "${GREEN}✓ Present${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
}

check_header "Strict-Transport-Security"
check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "Content-Security-Policy"

# Summary
echo ""
echo -e "${GREEN}=============================
DNS Verification Complete
=============================NC}"

# DNS propagation check
echo ""
echo "To check DNS propagation globally, visit:"
echo "https://www.whatsmydns.net/#A/${DOMAIN}"