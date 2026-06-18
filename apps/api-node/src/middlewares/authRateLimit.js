import rateLimit from 'express-rate-limit';

const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000'),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

export default authRateLimiter;
