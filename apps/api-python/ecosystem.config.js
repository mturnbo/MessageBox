module.exports = {
  apps: [
    {
      name: 'messagebox-api-python',
      cwd: __dirname,
      script: 'uv',
      args: 'run uvicorn src.main:app --host 0.0.0.0 --port 4000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
