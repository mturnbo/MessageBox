import pino from 'pino';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const level = process.env.LOG_LEVEL || (NODE_ENV === 'test' ? 'silent' : 'info');

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.authorization',
  '*.creditCard',
  '*.cardNumber',
  '*.cvv',
  '*.ssn',
];

function buildTransport() {
  const targets = [
    {
      target: 'pino-roll',
      level,
      options: {
        file: path.join(path.resolve(), 'logs', 'app'),
        frequency: 'daily',
        dateFormat: 'yyyy-MM-dd',
        extension: '.log',
        mkdir: true,
      },
    },
  ];

  if (NODE_ENV !== 'production') {
    targets.push({
      target: 'pino-pretty',
      level,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });
  }

  return pino.transport({ targets });
}

const logger = pino(
  {
    level,
    redact: { paths: redactPaths, censor: '[REDACTED]' },
  },
  NODE_ENV === 'test' ? undefined : buildTransport()
);

export default logger;
