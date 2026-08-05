// User Controller
import User from '#models/user.model.js';
import { Op } from "sequelize";
import { QUERIES } from "#config/constants.js";
import UserService from "#services/user.service.js";
import { sendError } from "#utils/errorResponse.js";

const defaultAttributes = ['id', 'username', 'email', 'firstName', 'lastName', 'deviceAddress', 'dateCreated', 'lastLogin'];

const UserController = {
  getAllUsers: async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.params.limit) || QUERIES.DEFAULT_LIMIT, QUERIES.MAX_LIMIT);
      let page = parseInt(req.params.page) || 1;
      if (isNaN(page) || page < 1) page = 1;
      const offset = (page - 1) * limit;
      const users = await User.findAll({
        offset: offset,
        limit: limit,
        attributes: defaultAttributes
      });
      res.status(200).json(users);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  },

  createUser: async (req, res) => {
    const { username, email, firstName, lastName, deviceAddress } = req.body;
    try {
      if (await UserService.isEmailOrUsernameTaken(email, username)) {
        return sendError(res, 409, 'Email or username already taken');
      }
      const newUser = await User.create({
        username,
        email,
        firstName,
        lastName,
        deviceAddress
      });
      res.status(201).json(newUser);
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  },

  // Get user by id, username or email
  getUser: async (req, res) => {
    const id = req.params.id;
    try {
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { id: id },
            { username: id },
            { email: id},
          ]
        },
        attributes: defaultAttributes,
      });
      if (user) {
        res.status(200).json(user);
      } else {
        sendError(res, 404, 'User not found');
      }
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  },

  updateUser: async (req, res) => {
    const { id, userUpdate } = req.body;
    const updatableFields = ['username', 'password', 'email', 'firstName', 'lastName', 'deviceAddress'];
    try {
      const user = await User.findByPk(id);
      if (user) {
        Object.keys(userUpdate).forEach(key => {
          if (updatableFields.includes(key)) {
            user[key] = userUpdate[key];
          }
        });
        await user.save();
        res.status(200).json({ status: 'User updated successfully', user: user });
      } else {
        sendError(res, 404, 'User not found');
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => (`Validation error on field ${err.path}: ${err.message}`));
        sendError(res, 400, 'User not updated', validationErrors);
      } else {
        sendError(res, 500, 'Internal Server Error');
      }
    }
  },

  deleteUser: async (req, res) => {
    const id = req.params.id;
    try {
      const user = await User.findByPk(id);
      if (user) {
        await user.destroy();
        res.status(200).json(user);
      } else {
        sendError(res, 404, 'User not found');
      }
    } catch (error) {
      sendError(res, 500, 'Internal Server Error');
    }
  }
};

export default UserController;
