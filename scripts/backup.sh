#!/bin/bash

# True Label Backup Script
# Performs automated backups of database and uploaded files

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/truelabel}"
DB_NAME="${DB_NAME:-truelabel_prod}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-truelabel_user}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/uploads/truelabel}"
S3_BUCKET="${S3_BUCKET}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/truelabel/backup.log"

# Email configuration
ALERT_EMAIL="${ALERT_EMAIL}"
SLACK_WEBHOOK="${SLACK_WEBHOOK}"

# Colors for terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_notification "ERROR" "$1"
    exit 1
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        local emoji="✅"
        local color="good"
        
        if [ "$status" = "ERROR" ]; then
            emoji="❌"
            color="danger"
        elif [ "$status" = "WARNING" ]; then
            emoji="⚠️"
            color="warning"
        fi
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$emoji True Label Backup $status\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"footer\": \"Backup System\",
                    \"ts\": $(date +%s)
                }]
            }" \
            $SLACK_WEBHOOK > /dev/null
    fi
    
    # Email notification for errors
    if [ "$status" = "ERROR" ] && [ ! -z "$ALERT_EMAIL" ]; then
        echo -e "Subject: True Label Backup Failed\n\n$message\n\nTime: $(date)" | \
            sendmail "$ALERT_EMAIL"
    fi
}

# Create backup directories
create_directories() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/configs"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Backup database
backup_database() {
    log "Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/database/db_backup_$TIMESTAMP.sql.gz"
    
    # Set PGPASSWORD to avoid password prompt
    export PGPASSWORD="${DB_PASSWORD}"
    
    # Perform backup with compression
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-owner --no-acl --clean --if-exists | \
        gzip -9 > "$db_backup_file"; then
        
        local size=$(du -h "$db_backup_file" | cut -f1)
        log "Database backup completed: $db_backup_file (Size: $size)"
        
        # Verify backup integrity
        if ! gzip -t "$db_backup_file" 2>/dev/null; then
            error_exit "Database backup file is corrupted"
        fi
        
        echo "$db_backup_file"
    else
        error_exit "Database backup failed"
    fi
    
    unset PGPASSWORD
}

# Backup uploaded files
backup_files() {
    log "Starting file backup..."
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        log "WARNING: Uploads directory not found: $UPLOADS_DIR"
        return
    fi
    
    local files_backup_file="$BACKUP_DIR/files/files_backup_$TIMESTAMP.tar.gz"
    
    # Create tar archive with compression
    if tar -czf "$files_backup_file" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" 2>/dev/null; then
        local size=$(du -h "$files_backup_file" | cut -f1)
        log "Files backup completed: $files_backup_file (Size: $size)"
        echo "$files_backup_file"
    else
        log "WARNING: Files backup failed or no files to backup"
    fi
}

# Backup configuration files
backup_configs() {
    log "Starting configuration backup..."
    
    local config_backup_file="$BACKUP_DIR/configs/config_backup_$TIMESTAMP.tar.gz"
    local temp_dir=$(mktemp -d)
    
    # Collect configuration files
    mkdir -p "$temp_dir/server"
    mkdir -p "$temp_dir/client"
    mkdir -p "$temp_dir/nginx"
    
    # Copy configuration files (excluding sensitive data)
    cp /var/www/truelabel/server/package.json "$temp_dir/server/" 2>/dev/null || true
    cp /var/www/truelabel/server/prisma/schema.prisma "$temp_dir/server/" 2>/dev/null || true
    cp /var/www/truelabel/client/package.json "$temp_dir/client/" 2>/dev/null || true
    cp /etc/nginx/sites-available/truelabel "$temp_dir/nginx/" 2>/dev/null || true
    cp /var/www/truelabel/ecosystem.config.js "$temp_dir/" 2>/dev/null || true
    
    # Create archive
    if tar -czf "$config_backup_file" -C "$temp_dir" . 2>/dev/null; then
        log "Configuration backup completed: $config_backup_file"
        echo "$config_backup_file"
    else
        log "WARNING: Configuration backup failed"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Upload to S3
upload_to_s3() {
    local file=$1
    
    if [ -z "$S3_BUCKET" ]; then
        log "S3 backup skipped (S3_BUCKET not configured)"
        return
    fi
    
    log "Uploading to S3: $(basename "$file")"
    
    # Determine S3 path based on file type
    local s3_path=""
    case "$file" in
        *db_backup*) s3_path="database/" ;;
        *files_backup*) s3_path="files/" ;;
        *config_backup*) s3_path="configs/" ;;
    esac
    
    # Upload to S3
    if aws s3 cp "$file" "s3://$S3_BUCKET/backups/$s3_path$(basename "$file")" \
        --storage-class STANDARD_IA; then
        log "S3 upload completed: $(basename "$file")"
    else
        log "WARNING: S3 upload failed for $(basename "$file")"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null
    
    # S3 cleanup
    if [ ! -z "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        # List and delete old S3 objects
        aws s3api list-objects-v2 \
            --bucket "$S3_BUCKET" \
            --prefix "backups/" \
            --query "Contents[?LastModified<='$cutoff_date'].Key" \
            --output text | \
        while read -r key; do
            if [ ! -z "$key" ]; then
                aws s3 rm "s3://$S3_BUCKET/$key"
                log "Deleted old S3 backup: $key"
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Generate backup report
generate_report() {
    local db_backup=$1
    local files_backup=$2
    local config_backup=$3
    
    log "Generating backup report..."
    
    local report_file="$BACKUP_DIR/backup_report_$TIMESTAMP.txt"
    
    cat > "$report_file" << EOF
True Label Backup Report
========================
Date: $(date)
Timestamp: $TIMESTAMP

Database Backup:
- File: $(basename "$db_backup")
- Size: $(du -h "$db_backup" 2>/dev/null | cut -f1 || echo "N/A")
- Status: $([ -f "$db_backup" ] && echo "Success" || echo "Failed")

Files Backup:
- File: $(basename "$files_backup")
- Size: $(du -h "$files_backup" 2>/dev/null | cut -f1 || echo "N/A")
- Status: $([ -f "$files_backup" ] && echo "Success" || echo "Failed")

Configuration Backup:
- File: $(basename "$config_backup")
- Size: $(du -h "$config_backup" 2>/dev/null | cut -f1 || echo "N/A")
- Status: $([ -f "$config_backup" ] && echo "Success" || echo "Failed")

S3 Upload: $([ ! -z "$S3_BUCKET" ] && echo "Enabled" || echo "Disabled")
Retention: $RETENTION_DAYS days

Disk Usage:
$(df -h "$BACKUP_DIR" | tail -n 1)

Recent Backups:
$(ls -lh "$BACKUP_DIR/database/" | tail -n 5)
EOF
    
    log "Report saved: $report_file"
}

# Verify backup
verify_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        return 1
    fi
    
    # Check file size
    local size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file" 2>/dev/null)
    if [ "$size" -lt 1000 ]; then
        log "WARNING: Backup file seems too small: $backup_file"
        return 1
    fi
    
    # Test compression integrity
    case "$backup_file" in
        *.gz)
            gzip -t "$backup_file" 2>/dev/null || return 1
            ;;
        *.tar.gz)
            tar -tzf "$backup_file" > /dev/null 2>&1 || return 1
            ;;
    esac
    
    return 0
}

# Main backup process
main() {
    log "=== Starting True Label backup process ==="
    
    # Check prerequisites
    command -v pg_dump >/dev/null 2>&1 || error_exit "pg_dump not found. Please install PostgreSQL client."
    
    # Create directories
    create_directories
    
    # Perform backups
    db_backup=$(backup_database)
    files_backup=$(backup_files)
    config_backup=$(backup_configs)
    
    # Verify backups
    backup_success=true
    if ! verify_backup "$db_backup"; then
        log "ERROR: Database backup verification failed"
        backup_success=false
    fi
    
    # Upload to S3 if configured
    if [ ! -z "$S3_BUCKET" ]; then
        [ -f "$db_backup" ] && upload_to_s3 "$db_backup"
        [ -f "$files_backup" ] && upload_to_s3 "$files_backup"
        [ -f "$config_backup" ] && upload_to_s3 "$config_backup"
    fi
    
    # Clean old backups
    cleanup_old_backups
    
    # Generate report
    generate_report "$db_backup" "$files_backup" "$config_backup"
    
    # Send notification
    if [ "$backup_success" = true ]; then
        log "=== Backup process completed successfully ==="
        send_notification "SUCCESS" "Backup completed successfully at $(date)"
    else
        log "=== Backup process completed with errors ==="
        send_notification "WARNING" "Backup completed with warnings. Check logs for details."
    fi
}

# Lock file to prevent concurrent runs
LOCK_FILE="/var/run/truelabel-backup.lock"

# Check if another instance is running
if [ -f "$LOCK_FILE" ]; then
    pid=$(cat "$LOCK_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
        log "Another backup process is already running (PID: $pid)"
        exit 0
    else
        log "Removing stale lock file"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"

# Ensure lock file is removed on exit
trap 'rm -f "$LOCK_FILE"' EXIT

# Run main backup process
main

# Exit successfully
exit 0