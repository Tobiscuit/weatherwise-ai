module.exports = {
  apps: [
    {
      name: 'weatherwise-ai',
      script: 'dist/server.js',
      cwd: '/opt/weatherwise',
      user: 'weatherwise',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8089,
        CLOUD_RUN_URL: process.env.CLOUD_RUN_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
      },
      error_file: '/var/log/pm2/weatherwise-error.log',
      out_file: '/var/log/pm2/weatherwise-out.log',
      log_file: '/var/log/pm2/weatherwise-combined.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'yourapp2',
      script: 'dist/server.js',
      cwd: '/opt/yourapp2',
      user: 'yourapp2',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8090
      },
      error_file: '/var/log/pm2/yourapp2-error.log',
      out_file: '/var/log/pm2/yourapp2-out.log',
      log_file: '/var/log/pm2/yourapp2-combined.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'yourapp3',
      script: 'dist/server.js',
      cwd: '/opt/yourapp3',
      user: 'yourapp3',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8091
      },
      error_file: '/var/log/pm2/yourapp3-error.log',
      out_file: '/var/log/pm2/yourapp3-out.log',
      log_file: '/var/log/pm2/yourapp3-combined.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}; 