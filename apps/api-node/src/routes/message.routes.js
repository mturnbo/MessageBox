import { Router } from 'express';
import MessageController from '#controllers/message.controller.js';
import { authMiddleware } from "#middlewares/auth.middleware.js";
import apiRateLimiter from '#middlewares/apiRateLimit.js';

const router = Router();

router.use(apiRateLimiter);

/**
 * @swagger
 * /messages/inbox:
 *   get:
 *     summary: Get inbox for a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Inbox messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/inbox', authMiddleware, MessageController.getInbox);

/**
 * @swagger
 * /messages/sent:
 *   get:
 *     summary: Get sent messages for a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: senderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Sent messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/sent', authMiddleware, MessageController.getSent);

/**
 * @swagger
 * /messages/{id}/thread:
 *   get:
 *     summary: Get thread for a message
 *     description: Returns the full conversation thread that the given message belongs to.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thread found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: integer
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/:id/thread', authMiddleware, MessageController.getThreadByMessageId);

/**
 * @swagger
 * /messages/{id}:
 *   get:
 *     summary: Get a message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/:id', authMiddleware, MessageController.getMessageById);

/**
 * @swagger
 * /messages/post:
 *   post:
 *     summary: Send a message
 *     description: >
 *       Creates a new message. Supports idempotency — supply a unique `clientMessageId`
 *       in the body or an `Idempotency-Key` header. If the same key is seen again within
 *       the deduplication window, the original message is returned with `idempotencyReplayed: true`.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageRequest'
 *     responses:
 *       200:
 *         description: Message created (or replayed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagePostResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/post', authMiddleware, MessageController.createMessage);

/**
 * @swagger
 * /messages/reply:
 *   post:
 *     summary: Reply to a message
 *     description: Creates a new message and attaches it to the existing conversation thread.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplyRequest'
 *     responses:
 *       200:
 *         description: Reply sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagePostResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/reply', authMiddleware, MessageController.replyToMessage);

/**
 * @swagger
 * /messages/read:
 *   post:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *               readerAddress:
 *                 type: string
 *                 description: IP address of the reader
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/read', authMiddleware, MessageController.readMessage);

/**
 * @swagger
 * /messages/delete:
 *   post:
 *     summary: Soft-delete a message
 *     description: >
 *       Sets `deletedBySender` or `deletedByRecipient` timestamp based on `deletedBy`.
 *       The message is only fully removed when both parties have deleted it.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, deletedBy]
 *             properties:
 *               id:
 *                 type: integer
 *               deletedBy:
 *                 type: integer
 *                 description: User ID of the person deleting the message
 *     responses:
 *       200:
 *         description: Message soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/delete', authMiddleware, MessageController.deleteMessage);

export default router;
