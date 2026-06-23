const REQUIRED = [
  'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_TYPE',
  'JWT_SECRET', 'JWT_EXPIRATION_TIME',
];

export function validateEnv() {
  const missing = REQUIRED.filter(v => !process.env[v]);
  if (process.env.SERVER_JWT === 'true') {
    ['SERVER_JWT_SECRET', 'SERVER_JWT_TIMEOUT']
      .filter(v => !process.env[v])
      .forEach(v => missing.push(v));
  }
  if (missing.length) {
    missing.forEach(v => console.error(`[CONFIG] Missing required env var: ${v}`));
    process.exit(1);
  }
}
