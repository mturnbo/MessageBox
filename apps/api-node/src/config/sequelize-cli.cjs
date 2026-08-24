const dotenv = require('dotenv');
const pino = require('pino');

dotenv.config();

const logger = pino();

const shared = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: (msg) => logger.debug(msg),
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
