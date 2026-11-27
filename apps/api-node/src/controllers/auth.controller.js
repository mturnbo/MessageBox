// Authentication Controller
import User from '#models/user.model.js';
import { Op } from 'sequelize';
import { BadRequestError, UnauthorizedError } from "#utils/ApiErrors.js";
import { signAccessToken, signRefreshToken } from "#utils/token.js";

const AuthenticationController = {

  authenticateUser: async (req, res, next) => {
    const user = await User.findOne({
      where: { [Op.or]: [{ username: req.body.username }, { email: req.body.username }] }
    });

    if (!user) throw new BadRequestError();

    if (!(await user.checkPassword(req.body.password))) throw new UnauthorizedError();

    user.lastLogin = new Date().toISOString().replace(/T/, ' ').replace(/\..+/g, '')
    await user.save();

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({ username: user.username, token, refreshToken });
  }
}

export default AuthenticationController;
