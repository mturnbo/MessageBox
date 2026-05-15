export const apps = [
  {
    name: 'messagebox-frontend-react',
    script: 'npx',
    args: 'serve -s dist/frontend/browser -p 8080',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
    },
  },
];
