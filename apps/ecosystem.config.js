module.exports = {
  apps: [
    {
      name: 'messagebox-api-node',
      cwd: `${__dirname}/api-node`,
      script: 'src/app.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        ORIGIN: 4000,
        JWT_REFRESH_EXPIRATION_TIME: '7d',
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
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        ORIGIN: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      // Angular dev server — ng serve handles its own HMR, do not set watch: true
      name: 'messagebox-frontend-angular',
      cwd: `${__dirname}/frontend-angular`,
      script: 'node_modules/@angular/cli/bin/ng',
      args: 'serve --port 4000 --host 0.0.0.0',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
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
      // React dev server via Vite — runs on 4001 to avoid conflict with Angular on 4000
      // For production: build first with `npm run build`, then serve apps/frontend-react/dist/
      name: 'messagebox-frontend-react',
      cwd: `${__dirname}/frontend-react`,
      script: 'node_modules/.bin/vite',
      args: '--port 4001 --host 0.0.0.0',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    },
  ],
};
