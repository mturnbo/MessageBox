import dotenv from "dotenv";
import { validateEnv } from "./config/validateEnv.js";
import expressService from "./services/express.service.js";
import logger from "./config/logger.js";

dotenv.config();
validateEnv();

(async () => {
  try {
    await expressService.init();
  } catch (error) {
    logger.error(error);
    logger.flush(() => process.exit(1));
  }
})();
