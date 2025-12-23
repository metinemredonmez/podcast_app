// PM2 Ecosystem Configuration
// Sunucuda calistirmak icin: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'podcast-backend',
      cwd: './apps/backend',
      script: 'dist/main.js',
      instances: 1, // Veya 'max' tum CPU core'lari icin
      exec_mode: 'fork', // Veya 'cluster' multi-instance icin
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '../../.env.prod',
      env: {
        NODE_ENV: 'production',
        PORT: 3300,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
