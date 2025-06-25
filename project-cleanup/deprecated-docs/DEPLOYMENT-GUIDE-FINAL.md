# 🚀 True Label - Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Redis server
- Domain name with SSL certificate
- Server with at least 2GB RAM

## 1. Environment Setup

### Production Environment Variables

Create `.env.production` file:

```bash
# Server Configuration
NODE_ENV=production
PORT=9100

# Database
DATABASE_URL=postgresql://user:password@host:5432/truelabel_prod
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Security
JWT_SECRET=your-very-long-random-string-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/uploads/truelabel

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# API Keys
OPENAI_API_KEY=your-openai-key-if-using-ai
```

## 2. Database Setup

### PostgreSQL Setup

```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE truelabel_prod;
CREATE USER truelabel_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE truelabel_prod TO truelabel_user;
\q

# Run migrations
cd server
npm run migrate:postgresql
npm run seed  # Only if you want demo data
```

### Redis Setup

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis password
sudo nano /etc/redis/redis.conf
# Add: requirepass your-redis-password

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

## 3. Build Process

```bash
# Clone repository
git clone https://github.com/yourusername/true-label.git
cd true-label

# Install dependencies
npm run install:all

# Build frontend
cd client
npm run build
cd ..

# Build backend
cd server
npm run build
cd ..
```

## 4. Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/truelabel`:

```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/truelabel/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_http_version 1.1;
        proxy_set_header Host api.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/truelabel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cd true-label
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'truelabel-api',
      script: './server/dist/index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 9100
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Memory limit
      max_memory_restart: '1G',
      // Environment
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

## 5. Security Hardening

### Firewall Setup

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Security Headers

Add to Nginx configuration:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 6. Monitoring Setup

### Application Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor processes
pm2 monit
```

### Log Management

Create `/etc/logrotate.d/truelabel`:

```
/var/www/truelabel/server/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Checks

Create monitoring script `monitor.sh`:

```bash
#!/bin/bash

API_URL="https://api.yourdomain.com/health"
SLACK_WEBHOOK="your-slack-webhook-url"

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -ne 200 ]; then
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"⚠️ True Label API is down! Status: '$response'"}' \
    $SLACK_WEBHOOK
    
    # Restart service
    pm2 restart truelabel-api
fi
```

Add to crontab:
```bash
*/5 * * * * /home/ubuntu/monitor.sh
```

## 7. Backup Strategy

### Database Backup

Create `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/truelabel"
DB_NAME="truelabel_prod"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz s3://your-backup-bucket/
```

Add to crontab:
```bash
0 2 * * * /home/ubuntu/backup.sh
```

## 8. Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting True Label deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Build frontend
cd client
npm run build
cd ..

# Build backend
cd server
npm run build

# Run migrations
npm run migrate

# Restart services
pm2 restart truelabel-api

echo "✅ Deployment complete!"
```

## 9. Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Verify file upload directory permissions
- [ ] Test email sending
- [ ] Check SSL certificate
- [ ] Verify CORS settings
- [ ] Test API endpoints
- [ ] Monitor application logs
- [ ] Set up alerts
- [ ] Create first admin user
- [ ] Document API endpoints
- [ ] Set up staging environment

## 10. Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection string
   psql $DATABASE_URL
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **PM2 Process Crash**
   ```bash
   # Check logs
   pm2 logs truelabel-api
   
   # Check error logs
   tail -f /var/www/truelabel/server/logs/pm2-error.log
   ```

4. **Nginx 502 Bad Gateway**
   ```bash
   # Check if backend is running
   curl http://localhost:9100/health
   
   # Check Nginx error logs
   tail -f /var/log/nginx/error.log
   ```

## Support

For deployment support:
- Documentation: https://github.com/yourusername/true-label/wiki
- Issues: https://github.com/yourusername/true-label/issues
- Email: support@yourdomain.com

---

**Remember**: Always test deployments in a staging environment first!