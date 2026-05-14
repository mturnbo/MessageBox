import jwt from "jsonwebtoken";
import { STATUS } from "#config/constants.js";
import dotenv from "dotenv";

dotenv.config();

let jwtidCounter = 0;
const JWT_SECRET = process.env.JWT_SECRET;

const JwtService = {
  jwtSign: (_payload) => {
    try {
      if (process.env.JWT_ENABLED !== "true") {
        throw new Error("[JWT] Flag is not set");
      }

      console.log("[JWT] Generating JWT sign");

      const payload = JSON.parse(JSON.stringify(_payload));

      jwtidCounter += 1;
      return jwt.sign({ payload }, process.env.SERVER_JWT_SECRET, {
        expiresIn: Number(process.env.SERVER_JWT_TIMEOUT),
        jwtid: jwtidCounter + "",
      });
    } catch (error) {
      console.log("[JWT] Error during JWT signing");
      throw error;
    }
  },

  jwtGetToken: (request) => {
    try {
      if (process.env.SERVER_JWT !== "true") {
        throw new Error("[JWT] Flag is not set");
      }

      if (
        !request.headers.authorization ||
        request.headers.authorization.split(" ")[0] !== "Bearer"
      ) {
        throw new Error("[JWT] JWT token not provided");
      }

      return request.headers.authorization.split(" ")[1];
    } catch (error) {
      console.log("[JWT] Error getting JWT token");
      throw error;
    }
  },

  jwtVerify: (token) => {
    try {
      if (process.env.SERVER_JWT !== "true") {
        throw new Error("[JWT] JWT flag is not set");
      }

      return jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({
            status: STATUS.UNAUTHORIZED,
            error: 'Invalid or expired token'
          });
        }
        req.user = user;
        next();
      });


      return jwt.verify(
        token,
        JWT_SECRET,
        (err, decoded) => {
          console.log(decoded);
          if (err != null) throw err;
          return decoded.payload;
        }
      );
    } catch (error) {
      console.log("[JWT] Error getting JWT token");
      throw error;
    }
  },
};

export default JwtService;
