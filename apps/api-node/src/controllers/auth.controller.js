// Authentication Controller
import User from '#models/user.model.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { BadRequestError, UnauthorizedError } from "#utils/ApiErrors.js";

dotenv.config();

const AuthenticationController = {

  authenticateUser: async (req, res, next) => {
    const user = await User.findOne({ where: {username: req.body.username } });

    if (!user) throw new BadRequestError();

    if (!(await user.checkPassword(req.body.password))) throw new UnauthorizedError();

    user.lastLogin = new Date().toISOString().replace(/T/, ' ').replace(/\..+/g, '')
    await user.save();

    console.log('SETTING JWT Token expires in: ', process.env.JWT_EXPIRATION_TIME, 'seconds')

    const token = jwt.sign(
      {username: user.username},
      process.env.JWT_SECRET,
      {expiresIn: process.env.JWT_EXPIRATION_TIME}
    );

    res.json({ username: user.username, token });
  }
}

export default AuthenticationController;
