import { Router } from 'express';
import UserController from '#controllers/user.controller.js';
import { authMiddleware } from "#middlewares/auth.middleware.js";

const router = Router();

// GET all users
router.get('/', authMiddleware, UserController.getAllUsers );

// GET all users with pagination
router.get('/:limit/:page', authMiddleware, UserController.getAllUsers );

// GET user by id
router.get('/:id', authMiddleware, UserController.getUser );

// POST update user
router.post('/update/', authMiddleware, UserController.updateUser);

// POST Delete user
router.delete('/delete/:id', authMiddleware, UserController.deleteUser);

export default router;
