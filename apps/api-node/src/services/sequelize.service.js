import { Sequelize } from "sequelize";
import databaseConfig from "../config/database";
import fs from "fs";
import logger from "../config/logger.js";

const modelFiles = fs
  .readdirSync(__dirname + "/../models/")
  .filter((file) => file.endsWith(".js"));

const sequelizeService = {
  init: async () => {
    try {
      let connection = new Sequelize(databaseConfig);

      /*
        Loading models automatically
      */

      for (const file of modelFiles) {
        const model = await import(`../models/${file}`);
        model.default.init(connection);
      }

      modelFiles.map(async (file) => {
        const model = await import(`../models/${file}`);
        model.default.associate && model.default.associate(connection.models);
      });

      logger.info("[SEQUELIZE] Database service initialized");
    } catch (error) {
      logger.error(error, "[SEQUELIZE] Error during database service initialization");
      throw error;
    }
  },
};

export default sequelizeService;
