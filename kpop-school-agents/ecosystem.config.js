export default {
  apps: [
    {
      name: 'kpop-school-agents',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'kpop-email-cron',
      script: 'src/email/cron.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: { NODE_ENV: 'production' },
      error_file: 'logs/email-error.log',
      out_file: 'logs/email-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
