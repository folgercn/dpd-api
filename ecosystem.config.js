module.exports = {
  apps: [
    {
      name: 'dpd-api',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:./dev.db'
      }
    }
  ]
};
