import { Router } from 'express';
import sequelize from '#config/database.js';

const router = Router();

/* GET Default Health Ping */
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
