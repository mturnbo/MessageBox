import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { STATUS } from "#config/constants.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: STATUS.UNAUTHORIZED,
            error: 'Access token required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: STATUS.UNAUTHORIZED,
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};
