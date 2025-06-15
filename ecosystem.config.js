module.exports = {
  apps: [
    {
      // API Server
      name: 'truelabel-api',
      script: './server/dist/index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 9100
      },
      
      // Logging
      error_file: './logs/pm2-api-error.log',
      out_file: './logs/pm2-api-out.log',
      log_file: './logs/pm2-api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 features
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Graceful start/stop
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // Watch & reload (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
      
      // Environment specific
      env_production: {
        NODE_ENV: 'production',
        PORT: 9100
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 9100
      }
    },
    
    {
      // Background Jobs Worker
      name: 'truelabel-worker',
      script: './server/dist/workers/queue-processor.js',
      cwd: './server',
      instances: 2,
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'queue'
      },
      
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10
    },
    
    {
      // Scheduled Tasks (Cron)
      name: 'truelabel-cron',
      script: './server/dist/workers/cron.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'cron'
      },
      
      error_file: './logs/pm2-cron-error.log',
      out_file: './logs/pm2-cron-out.log',
      log_file: './logs/pm2-cron-combined.log',
      
      max_memory_restart: '200M',
      autorestart: true,
      cron_restart: '0 0 * * *' // Restart daily at midnight
    }
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/true-label.git',
      path: '/var/www/truelabel',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: ['staging-server-ip'],
      ref: 'origin/staging',
      repo: 'git@github.com:yourusername/true-label.git',
      path: '/var/www/truelabel-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
    }
  }
};