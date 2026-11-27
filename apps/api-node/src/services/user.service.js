import User from '#models/user.model.js';
import { Op } from "sequelize";

const UserService = {
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
