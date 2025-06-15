#!/bin/bash

# True Label Health Check & Monitoring Script
# This script checks the health of the True Label system and sends alerts

# Configuration
API_URL="${API_URL:-https://api.yourdomain.com/health}"
FRONTEND_URL="${FRONTEND_URL:-https://yourdomain.com}"
SLACK_WEBHOOK="${SLACK_WEBHOOK}"
EMAIL_TO="${ALERT_EMAIL}"
LOG_FILE="/var/log/truelabel/monitor.log"
RESPONSE_TIME_THRESHOLD=1000  # milliseconds
CPU_THRESHOLD=80  # percentage
MEMORY_THRESHOLD=85  # percentage
DISK_THRESHOLD=90  # percentage

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Send alert function
send_alert() {
    local level=$1
    local service=$2
    local message=$3
    local details=$4
    
    # Log the alert
    log "ALERT [$level] $service: $message"
    
    # Send to Slack if webhook is configured
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        local emoji="⚠️"
        case $level in
            "CRITICAL") emoji="🚨" ;;
            "WARNING") emoji="⚠️" ;;
            "INFO") emoji="ℹ️" ;;
            "RESOLVED") emoji="✅" ;;
        esac
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$emoji *True Label Alert*\",
                \"attachments\": [{
                    \"color\": \"$([ \"$level\" = \"CRITICAL\" ] && echo \"danger\" || echo \"warning\")\",
                    \"fields\": [
                        {\"title\": \"Level\", \"value\": \"$level\", \"short\": true},
                        {\"title\": \"Service\", \"value\": \"$service\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false},
                        {\"title\": \"Details\", \"value\": \"$details\", \"short\": false},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": false}
                    ]
                }]
            }" \
            $SLACK_WEBHOOK > /dev/null
    fi
    
    # Send email if configured
    if [ ! -z "$EMAIL_TO" ]; then
        echo -e "Subject: True Label Alert - $level: $service\n\n$message\n\nDetails: $details\n\nTime: $(date)" | \
            sendmail "$EMAIL_TO"
    fi
}

# Check API health
check_api_health() {
    log "Checking API health..."
    
    # Measure response time
    start_time=$(date +%s%3N)
    response=$(curl -s -w "\n%{http_code}" -m 10 "$API_URL")
    end_time=$(date +%s%3N)
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    response_time=$((end_time - start_time))
    
    if [ "$http_code" -ne 200 ]; then
        send_alert "CRITICAL" "API" "API is down or returning errors" \
            "HTTP Status: $http_code, Response: $body"
        return 1
    elif [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
        send_alert "WARNING" "API" "API response time is slow" \
            "Response time: ${response_time}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)"
    else
        log "API health check passed (${response_time}ms)"
    fi
    
    return 0
}

# Check frontend
check_frontend() {
    log "Checking frontend..."
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$FRONTEND_URL")
    
    if [ "$http_code" -ne 200 ]; then
        send_alert "CRITICAL" "Frontend" "Frontend is not accessible" \
            "HTTP Status: $http_code"
        return 1
    else
        log "Frontend check passed"
    fi
    
    return 0
}

# Check database connection
check_database() {
    log "Checking database connection..."
    
    # Use API endpoint that requires database
    db_check=$(curl -s -m 10 "${API_URL%/health}/api/v1/health/db")
    
    if [ $? -ne 0 ] || [[ ! "$db_check" =~ "ok" ]]; then
        send_alert "CRITICAL" "Database" "Database connection failed" \
            "Response: $db_check"
        return 1
    else
        log "Database check passed"
    fi
    
    return 0
}

# Check Redis connection
check_redis() {
    log "Checking Redis connection..."
    
    # Check if Redis is running
    if ! pgrep -x "redis-server" > /dev/null; then
        send_alert "CRITICAL" "Redis" "Redis server is not running" \
            "Redis process not found"
        return 1
    fi
    
    # Try to ping Redis
    redis_ping=$(redis-cli ping 2>/dev/null)
    if [ "$redis_ping" != "PONG" ]; then
        send_alert "CRITICAL" "Redis" "Redis is not responding" \
            "Redis ping failed"
        return 1
    else
        log "Redis check passed"
    fi
    
    return 0
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # CPU usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print int($2)}')
    if [ $cpu_usage -gt $CPU_THRESHOLD ]; then
        send_alert "WARNING" "System" "High CPU usage detected" \
            "CPU usage: ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
    fi
    
    # Memory usage
    memory_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ $memory_usage -gt $MEMORY_THRESHOLD ]; then
        send_alert "WARNING" "System" "High memory usage detected" \
            "Memory usage: ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
    fi
    
    # Disk usage
    disk_usage=$(df -h / | awk 'NR==2 {print int($5)}')
    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        send_alert "CRITICAL" "System" "High disk usage detected" \
            "Disk usage: ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
    fi
    
    log "System resources - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%"
}

# Check PM2 processes
check_pm2_processes() {
    log "Checking PM2 processes..."
    
    # Get PM2 process list
    pm2_status=$(pm2 jlist 2>/dev/null)
    
    if [ -z "$pm2_status" ]; then
        send_alert "WARNING" "PM2" "Unable to get PM2 status" \
            "PM2 might not be running or accessible"
        return 1
    fi
    
    # Check each expected process
    for process in "truelabel-api" "truelabel-worker" "truelabel-cron"; do
        if ! echo "$pm2_status" | jq -r ".[].name" | grep -q "^$process$"; then
            send_alert "CRITICAL" "PM2" "Process $process is not running" \
                "Expected PM2 process not found"
        else
            status=$(echo "$pm2_status" | jq -r ".[] | select(.name==\"$process\") | .pm2_env.status")
            if [ "$status" != "online" ]; then
                send_alert "WARNING" "PM2" "Process $process is not online" \
                    "Status: $status"
            fi
        fi
    done
    
    log "PM2 processes check completed"
}

# Check SSL certificate expiry
check_ssl_certificates() {
    log "Checking SSL certificates..."
    
    for domain in "yourdomain.com" "api.yourdomain.com"; do
        cert_expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
            openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ ! -z "$cert_expiry" ]; then
            expiry_epoch=$(date -d "$cert_expiry" +%s)
            current_epoch=$(date +%s)
            days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ $days_until_expiry -lt 30 ]; then
                send_alert "WARNING" "SSL" "SSL certificate expiring soon" \
                    "Domain: $domain, Days until expiry: $days_until_expiry"
            fi
            
            log "SSL certificate for $domain expires in $days_until_expiry days"
        fi
    done
}

# Check backup status
check_backups() {
    log "Checking backup status..."
    
    # Check if backup file from last 24 hours exists
    backup_dir="/var/backups/truelabel"
    recent_backup=$(find "$backup_dir" -name "db_backup_*.sql.gz" -mtime -1 2>/dev/null | head -n1)
    
    if [ -z "$recent_backup" ]; then
        send_alert "WARNING" "Backup" "No recent backup found" \
            "No backup file found in the last 24 hours"
    else
        backup_size=$(du -h "$recent_backup" | cut -f1)
        log "Recent backup found: $(basename $recent_backup) (${backup_size})"
    fi
}

# Main monitoring function
main() {
    log "=== Starting True Label monitoring check ==="
    
    # Track overall health
    all_healthy=true
    
    # Run all checks
    check_api_health || all_healthy=false
    check_frontend || all_healthy=false
    check_database || all_healthy=false
    check_redis || all_healthy=false
    check_system_resources
    check_pm2_processes || all_healthy=false
    check_ssl_certificates
    check_backups
    
    # Overall status
    if [ "$all_healthy" = true ]; then
        log "=== All systems operational ==="
        
        # Send resolved alert if there was a previous critical alert
        if [ -f "/tmp/truelabel_alert_active" ]; then
            send_alert "RESOLVED" "System" "All systems are now operational" \
                "All health checks passed"
            rm -f "/tmp/truelabel_alert_active"
        fi
    else
        log "=== System issues detected ==="
        touch "/tmp/truelabel_alert_active"
    fi
    
    log "=== Monitoring check completed ==="\n"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Run main function
main

# Exit with appropriate code
[ "$all_healthy" = true ] && exit 0 || exit 1