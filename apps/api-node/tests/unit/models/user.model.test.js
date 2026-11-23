import { describe, expect, it } from "@jest/globals";
import User from '#models/user.model';

describe('User model', () => {
  describe('toJSON', () => {
    it('should omit passwordHash and password from serialized users', () => {
      const user = User.build({
        id: 1,
        username: 'testuser1',
        email: 'test@example.com',
        password: 'secret-password',
        passwordHash: '$2b$12$hash',
        firstName: 'Test',
        lastName: 'User'
      });

      const json = JSON.parse(JSON.stringify(user));

      expect(json).not.toHaveProperty('passwordHash');
      expect(json).not.toHaveProperty('password');
      expect(json).toMatchObject({
        id: 1,
        username: 'testuser1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should omit passwordHash when nested in another response object', () => {
      const user = User.build({ id: 2, username: 'testuser2', email: 'two@example.com', passwordHash: '$2b$12$hash' });

      const json = JSON.parse(JSON.stringify({ status: 'User updated successfully', user }));

      expect(json.user).not.toHaveProperty('passwordHash');
      expect(json.user.username).toBe('testuser2');
    });

    it('should keep passwordHash on the instance for password checks', () => {
      const user = User.build({ id: 3, username: 'testuser3', email: 'three@example.com', passwordHash: '$2b$12$hash' });

      user.toJSON();

      expect(user.passwordHash).toBe('$2b$12$hash');
    });
  });
});
