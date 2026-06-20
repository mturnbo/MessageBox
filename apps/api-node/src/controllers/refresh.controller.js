import jwt from 'jsonwebtoken';
import { BadRequestError, UnauthorizedError } from '#utils/ApiErrors.js';

const RefreshController = {
  refreshToken: (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new BadRequestError();
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
      if (payload.type !== 'refresh') throw new UnauthorizedError();
      const token = jwt.sign(
        { username: payload.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION_TIME }
      );
      res.json({ token });
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError();
    }
  }
};

export default RefreshController;
