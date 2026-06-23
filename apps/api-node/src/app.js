import dotenv from "dotenv";
import { validateEnv } from "./config/validateEnv.js";
import expressService from "./services/express.service.js";

dotenv.config();
validateEnv();

(async () => {
  try {
    await expressService.init();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
