import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import sinon from 'sinon';
import UserController from '#controllers/user.controller';
import User from '#models/user.model';
import { Op } from 'sequelize';
import { QUERIES } from '#config/constants.js';

describe('UserController', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    sandbox.restore();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    const defaultAttributes = ['id', 'username', 'email', 'firstName', 'lastName', 'deviceAddress', 'dateCreated', 'lastLogin'];

    it('should return all users with default pagination when no params provided', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com', firstName: 'John', lastName: 'Doe' },
        { id: 2, username: 'user2', email: 'user2@test.com', firstName: 'Jane', lastName: 'Smith' }
      ];

      req.params = {};
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 0,
        limit: 10,
        attributes: defaultAttributes
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return users with custom limit and page', async () => {
      const mockUsers = [
        { id: 11, username: 'user11', email: 'user11@test.com' }
      ];

      req.params = { limit: '5', page: '3' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 10, // (page 3 - 1) * limit 5 = 10
        limit: 5,
        attributes: defaultAttributes,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle page 1 correctly with custom limit', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com' }
      ];

      req.params = { limit: '20', page: '1' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 0, // (page 1 - 1) * limit 20 = 0
        limit: 20,
        attributes: defaultAttributes,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should use default limit when limit param is invalid', async () => {
      const mockUsers = [];
      req.params = { limit: 'invalid', page: '2' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 10,
        limit: 10,
        attributes: defaultAttributes,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should use default page (1) when page param is invalid', async () => {
      const mockUsers = [];
      req.params = { limit: '15', page: 'invalid' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 0,
        limit: 15,
        attributes: defaultAttributes,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle both invalid limit and page params', async () => {
      const mockUsers = [];
      req.params = { limit: 'abc', page: 'xyz' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      sandbox.assert.calledWith(User.findAll, {
        offset: 0,
        limit: 10,
        attributes: defaultAttributes,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return empty array when no users found', async () => {
      req.params = {};
      sandbox.stub(User, 'findAll').resolves([]);

      await UserController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      req.params = {};
      sandbox.stub(User, 'findAll').rejects(dbError);

      await UserController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: dbError });
    });

    it('should handle negative page numbers by treating as NaN', async () => {
      const mockUsers = [];
      req.params = { limit: '10', page: '-1' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      // parseInt('-1') = -1, offset would be (-1 - 1) * 10 = -20
      sandbox.assert.calledWith(User.findAll, {
        offset: 0,
        limit: 10,
        attributes: defaultAttributes,
      });
    });

    it('should handle zero page number', async () => {
      const mockUsers = [];
      req.params = { limit: '10', page: '0' };
      sandbox.stub(User, 'findAll').resolves(mockUsers);

      await UserController.getAllUsers(req, res);

      // (0 - 1) * 10 = -10
      sandbox.assert.calledWith(User.findAll, {
        offset: 0,
        limit: 10,
        attributes: defaultAttributes,
      });
    });
  });

  describe('getUserById', () => {
    const defaultAttributes = ['id', 'username', 'email', 'firstName', 'lastName', 'deviceAddress', 'dateCreated', 'lastLogin'];
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should return a user by id', async () => {
      req.params.id = '1';

      sandbox.stub(User, 'findOne').resolves(mockUser);

      await UserController.getUser(req, res);

      sandbox.assert.calledWith(User.findOne, {
        where: {
          [Op.or]: [
            { id: '1' },
            { username: '1' }
          ]
        },
        attributes: defaultAttributes
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return a user by username', async () => {
      req.params.id = 'testuser';

      sandbox.stub(User, 'findOne').resolves(mockUser);

      await UserController.getUser(req, res);

      sandbox.assert.calledWith(User.findOne, {
        where: {
          [Op.or]: [
            { id: 'testuser' },
            { username: 'testuser' }
          ]
        },
        attributes: defaultAttributes
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully with all fields', async () => {
      const mockUserData = {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@email.com',
        deviceAddress: '72.45.45.99',
      };
      const mockCreatedUser = { id: 1, ...mockUserData };

      req.body = mockUserData;
      sandbox.stub(User, 'create').resolves(mockCreatedUser);

      await UserController.createUser(req, res);

      sandbox.assert.calledWith(User.create, {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@email.com',
        deviceAddress: '72.45.45.99',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedUser);
    });
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = User.build( {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@email.com',
        deviceAddress: '72.45.45.99',
      });

      const saveStub = sinon.stub(mockUser, 'save').resolves(mockUser);

      const updateData = {
        lastName: 'Newlast',
        email: 'new.email@email.com',
        deviceAddress: '123.45.67.89',
      };

      req.body = {
        id: 1,
        userUpdate: updateData,
      };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await UserController.updateUser(req, res);

      sinon.assert.calledOnce(saveStub);
      expect(mockUser.lastName).toBe(updateData.lastName);
      expect(mockUser.email).toBe(updateData.email);
      expect(mockUser.deviceAddress).toBe(updateData.deviceAddress);

      saveStub.restore();
    });
  });

});