import { sendError } from '#utils/errorResponse.js';

/**
 * Middleware factory that enforces resource ownership.
 *
 * After authMiddleware has set req.user.id from the JWT, this middleware
 * compares it against the ID the caller placed in the request. Returns 403
 * if they don't match.
 *
 * @param {(req: import('express').Request) => string|number} extractId
 *   Callback that returns the claimed user ID from the request
 *   (e.g. req => req.query.recipientId, req => req.body.id).
 */
export const requireOwnership = (extractId) => (req, res, next) => {
  if (req.user.id !== parseInt(extractId(req), 10)) {
    return sendError(res, 403, 'Forbidden');
  }
  next();
};
