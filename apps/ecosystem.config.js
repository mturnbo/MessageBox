module.exports = {
  apps: [
    {
      name: 'messagebox-api-node',
      script: 'src/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4021,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8021,
      },
    },
    {
      name: 'messagebox-api-python',
      cwd: `${__dirname}/api-python`,
      script: '.venv/bin/python',
      args: ['-c', "import os,uvicorn; uvicorn.run('app.main:app', port=int(os.environ['PORT']))"],
      interpreter: 'none',
      instances: 1,
      // Default Environment (Development)
      env: {
        NODE_ENV: 'development',
        PORT: 4021,
        ORIGIN: 4201,
      },
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 8021,
      },
    },
    {
      name: 'messagebox-frontend-angular',
      script: 'npx',
      args: 'serve -s ./apps/frontend-angular/dist/message-box/browser',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 4201,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8201,
      },
    },
    {
      name: 'messagebox-frontend-react',
      script: 'npx',
      args: 'serve -s ./appa/frontend-react/dist/frontend/browser',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 4301,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8301,
      },
    }
  ],
};
