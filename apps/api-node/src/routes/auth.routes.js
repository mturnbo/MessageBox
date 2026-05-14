import { Router } from 'express';
import AuthenticationController from '#controllers/auth.controller.js';

const router = Router();

// POST authenticate user
router.post('/',  AuthenticationController.authenticateUser);

export default router;
