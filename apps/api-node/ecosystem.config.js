module.exports = {
  apps: [
    {
      name: 'messagebox-api-node',
      script: 'src/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
