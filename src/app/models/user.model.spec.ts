import type { AuthUser, LoginRequest, LoginResponse, User } from './user.model';

describe('User models', () => {
  describe('AuthUser', () => {
    it('should have username and token fields', () => {
      const user: AuthUser = { username: 'testuser', token: 'abc123' };
      expect(user.username).toBe('testuser');
      expect(user.token).toBe('abc123');
    });

    it('should allow optional userId', () => {
      const userWithId: AuthUser = { username: 'testuser', token: 'abc123', userId: 42 };
      expect(userWithId.userId).toBe(42);

      const userWithoutId: AuthUser = { username: 'testuser', token: 'abc123' };
      expect(userWithoutId.userId).toBeUndefined();
    });
  });

  describe('LoginRequest', () => {
    it('should have username and password fields', () => {
      const req: LoginRequest = { username: 'testuser', password: 'secret' };
      expect(req.username).toBe('testuser');
      expect(req.password).toBe('secret');
    });
  });

  describe('LoginResponse', () => {
    it('should have username and token fields', () => {
      const res: LoginResponse = { username: 'testuser', token: 'jwt.token.here' };
      expect(res.username).toBe('testuser');
      expect(res.token).toBe('jwt.token.here');
    });
  });

  describe('User', () => {
    it('should have required id, username, email, firstName, lastName fields', () => {
      const user: User = {
        id: 1,
        username: 'jdoe',
        email: 'jdoe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(user.id).toBe(1);
      expect(user.username).toBe('jdoe');
      expect(user.email).toBe('jdoe@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });

    it('should allow optional fields', () => {
      const user: User = {
        id: 1,
        username: 'jdoe',
        email: 'jdoe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        deviceAddress: '192.168.1.1',
        dateCreated: '2024-01-01',
        lastLogin: '2024-06-01',
      };
      expect(user.deviceAddress).toBe('192.168.1.1');
      expect(user.dateCreated).toBe('2024-01-01');
      expect(user.lastLogin).toBe('2024-06-01');
    });
  });
});
