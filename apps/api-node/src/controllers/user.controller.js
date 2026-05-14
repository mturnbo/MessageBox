// User Controller
import User from '#models/user.model.js';
import { Op } from "sequelize";
import { QUERIES } from "#config/constants.js";
import UserService from "#services/user.service.js";

const defaultAttributes = ['id', 'username', 'email', 'firstName', 'lastName', 'deviceAddress', 'dateCreated', 'lastLogin'];

const UserController = {
  getAllUsers: async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || QUERIES.DEFAULT_LIMIT;
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
      res.status(500).json({ error: error });
    }
  },

  createUser: async (req, res) => {
    const { username, email, firstName, lastName, deviceAddress } = req.body;
    try {
      if (await UserService.isEmailOrUsernameTaken(email, username)) {
        res.status(409).json({ error: 'Email or username already taken' });
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
      res.status(500).json({ error: 'Internal Server Error' });
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
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
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
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => (`Validation error on field ${err.path}: ${err.message}`));
        res.status(400).json({
          status: 'User not updated',
          errors: validationErrors,
        });
      } else {
        res.status(500).json({error: 'Internal Server Error'});
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
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export default UserController;
