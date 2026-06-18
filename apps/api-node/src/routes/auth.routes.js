import { Router } from 'express';
import AuthenticationController from '#controllers/auth.controller.js';
import RefreshController from '#controllers/refresh.controller.js';
import authRateLimiter from '#middlewares/authRateLimit.js';

const router = Router();

router.post('/', authRateLimiter, AuthenticationController.authenticateUser);
router.post('/refresh', RefreshController.refreshToken);

export default router;
