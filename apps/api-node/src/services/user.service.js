import User from '#models/user.model.js';
import { Op } from "sequelize";

const UserService = {
  getUserByUsername: async (username) => {
    return User.findOne({ where: { username }, attributes: ['id', 'username'] });
  },

  isEmailOrUsernameTaken: async (email, username) => {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    return !!user;
  },
};

export default UserService;
