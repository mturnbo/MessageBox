import { Sequelize } from 'sequelize';
import dotenv from "dotenv";
import logger from './logger.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_TYPE,
  logging: (msg) => logger.debug(msg),
});

export default sequelize;