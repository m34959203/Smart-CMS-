/**
 * PM2 Process Manager Configuration for PS.kz / Plesk
 *
 * This file defines how to run the AIMAK application using PM2
 * PM2 keeps your apps running in production
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop all
 *   pm2 restart all
 *   pm2 logs
 *   pm2 monit
 *
 * NOTE: On Plesk hosting (ps.kz), nginx handles port 80/443.
 *       The proxy.js is NOT needed - nginx proxies to our apps.
 *       Configure nginx in Plesk: Apache & nginx Settings
 */

module.exports = {
  apps: [
    // NOTE: aimak-proxy is DISABLED on Plesk - nginx handles proxying
    // Uncomment below ONLY if you're running without Plesk/nginx
    /*
    {
      name: 'aimak-proxy',
      script: './proxy.js',
      cwd: '/var/www/vhosts/aimaqaqshamy.kz/httpdocs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 80
      },
      error_file: './logs/proxy-error.log',
      out_file: './logs/proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10
    },
    */
    {
      name: 'aimak-api',
      cwd: './apps/api',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '../../logs/api-error.log',
      out_file: '../../logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart app if it crashes
      min_uptime: '10s',
      max_restarts: 10,
      // Environment specific config
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'aimak-web',
      cwd: './apps/web',
      script: 'npm',
      args: 'run start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '../../logs/web-error.log',
      out_file: '../../logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart app if it crashes
      min_uptime: '10s',
      max_restarts: 10,
      // Environment specific config
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
