// Authentication Controller
import User from '#models/user.model.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from 'sequelize';
import { BadRequestError, UnauthorizedError } from "#utils/ApiErrors.js";

dotenv.config();

const AuthenticationController = {

  authenticateUser: async (req, res, next) => {
    const user = await User.findOne({
      where: { [Op.or]: [{ username: req.body.username }, { email: req.body.username }] }
    });

    if (!user) throw new BadRequestError();

    if (!(await user.checkPassword(req.body.password))) throw new UnauthorizedError();

    user.lastLogin = new Date().toISOString().replace(/T/, ' ').replace(/\..+/g, '')
    await user.save();

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME }
    );

    const refreshToken = jwt.sign(
      { username: user.username, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME ?? '7d' }
    );

    res.json({ username: user.username, token, refreshToken });
  }
}

export default AuthenticationController;
