module.exports = {
  apps: [
    {
      name: 'messagebox-api-node',
      script: 'src/app.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
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
        PORT: 3000,
        ORIGIN: 4000,
      },
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'messagebox-frontend-angular',
      cwd: `${__dirname}/frontend-angular`,
      script: 'bash',
      args: ['-c', 'npm run build -- --configuration development && npx serve -s dist/message-box/browser'],
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    },
    {
      name: 'messagebox-frontend-react',
      script: 'npx',
      args: 'serve -s ./appa/frontend-react/dist/frontend/browser',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    }
  ],
};
