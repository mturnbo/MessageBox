// Authentication Controller
import User from '#models/user.model.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { BadRequestError, UnauthorizedError } from "#utils/ApiErrors.js";
import { signAccessToken, signRefreshToken } from "#utils/token.js";

// Cost-12 bcrypt hash compared against for unknown users, so they take as long as a wrong password
const DUMMY_PASSWORD_HASH = '$2b$12$Q5LeKKxjrqPEr8DEtozmfeDflxCMMRPT7kGQALi2/2PWBdDvBYbGm';

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

const AuthenticationController = {

  authenticateUser: async (req, res, next) => {
    const { username, password } = req.body ?? {};

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      throw new BadRequestError('username and password are required');
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] }
    });

    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedError();
    }

    if (!(await user.checkPassword(password))) throw new UnauthorizedError();

    user.lastLogin = new Date().toISOString().replace(/T/, ' ').replace(/\..+/g, '')
    await user.save();

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({ username: user.username, token, refreshToken });
  }
}

export default AuthenticationController;
