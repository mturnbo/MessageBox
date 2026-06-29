import UserService from '#services/user.service.js';

/**
 * Middleware factory that enforces resource ownership.
 *
 * After JWT authentication has set req.user.username, this middleware resolves
 * that username to a DB user ID and compares it against the ID the caller
 * placed in the request. Returns 403 if they don't match.
 *
 * @param {(req: import('express').Request) => string|number} extractId
 *   Callback that returns the claimed user ID from the request
 *   (e.g. req => req.query.recipientId, req => req.body.id).
 */
export const requireOwnership = (extractId) => async (req, res, next) => {
  try {
    const user = await UserService.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(401).json({ message: 'Authenticated user not found' });
    }
    if (user.id !== parseInt(extractId(req), 10)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user.id = user.id;
    next();
  } catch (err) {
    next(err);
  }
};
