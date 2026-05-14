import dotenv from "dotenv";
import expressService from "./services/express.service.js";

dotenv.config();

(async () => {
  try {
    await expressService.init();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
