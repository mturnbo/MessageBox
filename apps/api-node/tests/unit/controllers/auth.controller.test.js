import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import sinon from 'sinon';
import AuthenticationController from '#controllers/auth.controller';
import User from '#models/user.model';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
        id: 5,
        username: 'alice',
        passwordHash: '$2b$12$alicehash',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(true)
      };
      req.body = { username: 'alice', password: 'secret' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await AuthenticationController.authenticateUser(req, res);

      sandbox.assert.calledWith(User.findOne, expectedWhere('alice'));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice', token: expect.any(String), refreshToken: expect.any(String) })
      );
      const { token, refreshToken } = res.json.mock.calls[0][0];
      const access = jwt.decode(token);
      const refresh = jwt.decode(refreshToken);
      expect(access).toMatchObject({ sub: '5', iss: 'messagebox-api-node', aud: 'messagebox' });
      expect(access.pwd_fp).toMatch(/^[0-9a-f]{16}$/);
      expect(access.username).toBeUndefined();
      expect(access.type).toBeUndefined();
      expect(refresh).toMatchObject({ sub: '5', pwd_fp: access.pwd_fp, type: 'refresh' });
    });

    it('should authenticate and return token when email matches', async () => {
      const mockUser = {
        id: 5,
        username: 'alice',
        passwordHash: '$2b$12$alicehash',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(true)
      };
      req.body = { username: 'alice@example.com', password: 'secret' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await AuthenticationController.authenticateUser(req, res);

      sandbox.assert.calledWith(User.findOne, expectedWhere('alice@example.com'));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice', token: expect.any(String), refreshToken: expect.any(String) })
      );
    });

    it('should throw 401 for an unknown user, the same as a wrong password', async () => {
      req.body = { username: 'nobody', password: 'pass' };
      sandbox.stub(User, 'findOne').resolves(null);

      await expect(AuthenticationController.authenticateUser(req, res))
        .rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should run a cost-12 bcrypt compare for an unknown user to equalize timing', async () => {
      req.body = { username: 'nobody', password: 'pass' };
      sandbox.stub(User, 'findOne').resolves(null);
      const compare = sandbox.spy(bcrypt, 'compare');

      await expect(AuthenticationController.authenticateUser(req, res)).rejects.toThrow();

      sandbox.assert.calledOnce(compare);
      const [password, hash] = compare.firstCall.args;
      expect(password).toBe('pass');
      expect(bcrypt.getRounds(hash)).toBe(12);
    });

    it.each([
      ['username is missing', { password: 'secret' }],
      ['password is missing', { username: 'alice' }],
      ['username is empty', { username: '', password: 'secret' }],
      ['password is empty', { username: 'alice', password: '' }],
      ['username is not a string', { username: { $gt: '' }, password: 'secret' }],
      ['password is not a string', { username: 'alice', password: 12345678 }],
    ])('should throw 400 without querying the database when %s', async (_, body) => {
      req.body = body;
      const findOne = sandbox.stub(User, 'findOne');

      await expect(AuthenticationController.authenticateUser(req, res))
        .rejects.toMatchObject({ statusCode: 400, message: 'username and password are required' });
      expect(findOne.called).toBe(false);
    });

    it('should throw 400 when the body is missing', async () => {
      req.body = undefined;

      await expect(AuthenticationController.authenticateUser(req, res))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      const mockUser = {
        id: 5,
        username: 'alice',
        passwordHash: '$2b$12$alicehash',
        lastLogin: null,
        save: jest.fn().mockResolvedValue(undefined),
        checkPassword: jest.fn().mockResolvedValue(false)
      };
      req.body = { username: 'alice', password: 'wrong' };
      sandbox.stub(User, 'findOne').resolves(mockUser);

      await expect(AuthenticationController.authenticateUser(req, res))
        .rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
});
