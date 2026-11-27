import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { requireOwnership } from '#middlewares/ownership.middleware.js';

describe('requireOwnership', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 5, username: 'alice' },
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
    jest.clearAllMocks();
  });

  it('calls next() when the claimed id matches the authenticated user', () => {
    req.query.recipientId = '5';

    requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when the claimed id belongs to a different user', () => {
    req.query.recipientId = '99';

    requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Forbidden' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the claimed id is missing', () => {
    requireOwnership((r) => r.query.recipientId)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('works with body id extractor (POST /users/update)', () => {
    req.body.id = 5;

    requireOwnership((r) => r.body.id)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('works with path param extractor (DELETE /users/delete/:id)', () => {
    req.params.id = '5';

    requireOwnership((r) => r.params.id)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
