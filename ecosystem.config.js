/**
 * PM2 Ecosystem 설정
 * 
 * 프로덕션 서버에서 실행:
 * - pm2 start ecosystem.config.js
 * - pm2 status
 * - pm2 logs signal-engine
 * - pm2 restart signal-engine
 */

module.exports = {
  apps: [
    {
      name: 'signal-engine',
      script: 'src/workers/signalWorker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/signal-engine-error.log',
      out_file: './logs/signal-engine-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
