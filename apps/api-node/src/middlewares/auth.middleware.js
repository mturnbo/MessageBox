import jwt from "jsonwebtoken";
import { JWT_SECRET } from "#config/validateEnv.js";
import { sendError } from "#utils/errorResponse.js";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendError(res, 401, 'Access token required');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.type === 'refresh') {
            return sendError(res, 403, 'Invalid or expired token');
        }
        req.user = user;
        next();
    });
};
