import { sendError } from "#utils/errorResponse.js";
import { findTokenUser, verifyToken } from "#utils/token.js";

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendError(res, 401, 'Access token required');
    }

    const payload = verifyToken(token);
    if (!payload || payload.type === 'refresh') {
        return sendError(res, 401, 'Invalid or expired token');
    }

    try {
        const user = await findTokenUser(payload);
        if (!user) {
            return sendError(res, 401, 'Authenticated user not found');
        }
        req.user = { id: user.id, username: user.username };
        next();
    } catch (err) {
        next(err);
    }
};
