module.exports = {
  apps: [
    {
      name: 'suvidha-one-frontend',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NEXT_PUBLIC_API_URL: 'https://suvidha-one.onrender.com',
        NEXT_PUBLIC_APP_NAME: 'SUVIDHA ONE',
        NEXT_PUBLIC_APP_VERSION: '1.0.0',
        NEXT_PUBLIC_KIOSK_MODE: 'true',
        NEXT_PUBLIC_RAZORPAY_KEY_ID: '',
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
