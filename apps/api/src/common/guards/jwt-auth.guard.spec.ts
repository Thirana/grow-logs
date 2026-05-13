import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('returns the user when no error and user is present', () => {
      const user = { userId: 'abc', role: 'USER' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('throws UnauthorizedException when user is false', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when an error is passed', () => {
      expect(() =>
        guard.handleRequest(new Error('token expired'), false),
      ).toThrow(UnauthorizedException);
    });
  });
});
