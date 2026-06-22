import { Router } from 'express';
import sequelize from '#config/database.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Pings the database and returns connection pool stats.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 database:
 *                   type: string
 *                   example: Connected
 *                 pool:
 *                   type: object
 *                   properties:
 *                     size:
 *                       type: integer
 *                     available:
 *                       type: integer
 *                     waiting:
 *                       type: integer
 *       503:
 *         description: Service is down
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: DOWN
 *                 database:
 *                   type: string
 *                   example: Disconnected
 *                 error:
 *                   type: string
 */
router.get('/', async (req, res, next) => {
  try {
    // Ping the database
    await sequelize.authenticate();

    // Optional: Check pool status
    const pool = sequelize.connectionManager.pool;

    res.status(200).json({
      status: 'UP',
      database: 'Connected',
      pool: {
        size: pool.size,
        available: pool.available,
        waiting: pool.waiting,
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      database: 'Disconnected',
      error: error.message
    });
  }
});

export default router;
