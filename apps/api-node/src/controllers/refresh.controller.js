import { BadRequestError, UnauthorizedError } from '#utils/ApiErrors.js';
import { findTokenUser, signAccessToken, verifyToken } from '#utils/token.js';

const RefreshController = {
  refreshToken: async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new BadRequestError();

    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') throw new UnauthorizedError();

    const user = await findTokenUser(payload);
    if (!user) throw new UnauthorizedError();

    res.json({ token: signAccessToken(user) });
  }
};

export default RefreshController;
