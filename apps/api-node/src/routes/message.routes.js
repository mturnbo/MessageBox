import { Router } from 'express';
import MessageController from '#controllers/message.controller.js';
import { authMiddleware } from "#middlewares/auth.middleware.js";

const router = Router();

// GET inbox for a user — must be before /:id to avoid named segments matching
// Query params: recipientId, page, limit
router.get('/inbox', authMiddleware, MessageController.getInbox);

// GET sent messages for a user
// Query params: senderId, page, limit
router.get('/sent', authMiddleware, MessageController.getSent);

// GET thread for a message
router.get('/:id/thread', authMiddleware, MessageController.getThreadByMessageId);

// GET message by id
router.get('/:id', authMiddleware, MessageController.getMessageById );

// POST new message
router.post('/post', authMiddleware, MessageController.createMessage );

// POST reply to a message
router.post('/reply', authMiddleware, MessageController.replyToMessage);

// POST update message read status
router.post('/read', authMiddleware, MessageController.readMessage);

// POST delete message
router.post('/delete', authMiddleware, MessageController.deleteMessage);

export default router;
