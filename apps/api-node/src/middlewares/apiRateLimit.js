import rateLimit from 'express-rate-limit';

const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS ?? '60000'),
  max: parseInt(process.env.API_RATE_LIMIT_MAX ?? '60'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

export default apiRateLimiter;
