import { Router } from 'express';
import AuthenticationController from '#controllers/auth.controller.js';
import authRateLimiter from '#middlewares/authRateLimit.js';

const router = Router();

// POST authenticate user
router.post('/', authRateLimiter, AuthenticationController.authenticateUser);

export default router;
