module.exports = {
  apps: [
    {
      name: 'english-node',
      cwd: './backend/backend-node',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'english-python',
      cwd: './backend/backend-python',
      script: 'venv/bin/uvicorn', // or python3 -m uvicorn
      args: 'app.main:app --host 127.0.0.1 --port 8000 --workers 1',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '350M',
      env: {
        ENVIRONMENT: 'production',
        PORT: 8000
      }
    }
  ]
};
