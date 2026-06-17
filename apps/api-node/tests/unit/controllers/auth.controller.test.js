import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import sinon from 'sinon';
import AuthenticationController from '#controllers/auth.controller';
import User from '#models/user.model';
import { Op } from 'sequelize';

describe('AuthenticationController', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {}
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

  describe('authenticateUser', () => {
    const expectedWhere = (value) => ({
      where: {
        [Op.or]: [{ username: value }, { email: value }]
      }
    });

    it('should authenticate and return token when username matches', async () => {
      const mockUser = {
        username: 'alice',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(true)
      };
      req.body = { username: 'alice', password: 'secret' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await AuthenticationController.authenticateUser(req, res);

      sandbox.assert.calledWith(User.findOne, expectedWhere('alice'));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice', token: expect.any(String) })
      );
    });

    it('should authenticate and return token when email matches', async () => {
      const mockUser = {
        username: 'alice',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(true)
      };
      req.body = { username: 'alice@example.com', password: 'secret' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await AuthenticationController.authenticateUser(req, res);

      sandbox.assert.calledWith(User.findOne, expectedWhere('alice@example.com'));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice', token: expect.any(String) })
      );
    });

    it('should throw BadRequestError when user not found', async () => {
      req.body = { username: 'nobody', password: 'pass' };
      sandbox.stub(User, 'findOne').resolves(null);

      await expect(AuthenticationController.authenticateUser(req, res)).rejects.toThrow();
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      const mockUser = {
        username: 'alice',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(false)
      };
      req.body = { username: 'alice', password: 'wrong' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await expect(AuthenticationController.authenticateUser(req, res)).rejects.toThrow();
    });
  });
});
