import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import sinon from 'sinon';
import UserService from '#services/user.service.js';
import { requireOwnership } from '#middlewares/ownership.middleware.js';

describe('requireOwnership', () => {
  let req, res, next, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      user: { username: 'alice' },
      query: {},
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    sandbox.restore();
    jest.clearAllMocks();
  });

  it('calls next() when the claimed id matches the authenticated user', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves({ id: 5, username: 'alice' });
    req.query.recipientId = '5';

    const middleware = requireOwnership((r) => r.query.recipientId);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('attaches req.user.id after a successful ownership check', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves({ id: 5, username: 'alice' });
    req.query.recipientId = '5';

    await requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(req.user.id).toBe(5);
  });

  it('returns 403 when the claimed id belongs to a different user', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves({ id: 5, username: 'alice' });
    req.query.recipientId = '99';

    await requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the authenticated username is not found in the database', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves(null);
    req.query.recipientId = '5';

    await requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authenticated user not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(err) on unexpected service errors', async () => {
    const boom = new Error('DB down');
    sandbox.stub(UserService, 'getUserByUsername').rejects(boom);
    req.query.recipientId = '5';

    await requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(next).toHaveBeenCalledWith(boom);
  });

  it('works with body id extractor (POST /users/update)', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves({ id: 7, username: 'alice' });
    req.body.id = 7;

    await requireOwnership((r) => r.body.id)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('works with path param extractor (DELETE /users/delete/:id)', async () => {
    sandbox.stub(UserService, 'getUserByUsername').resolves({ id: 7, username: 'alice' });
    req.params.id = '7';

    await requireOwnership((r) => r.params.id)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
