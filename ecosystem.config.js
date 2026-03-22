module.exports = {
  apps: [
    {
      name: 'egcrm-backend',
      cwd: '/home/egcrm/backend',
      script: '/home/egcrm/backend/venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: { PYTHONPATH: '/home/egcrm/backend' },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'egcrm-frontend',
      cwd: '/home/egcrm/frontend',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
