import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy.js';

const mockConfigService = {
  getOrThrow: (key: string) => {
    if (key === 'JWT_SECRET') return 'test-secret-that-is-at-least-32-chars!!';
    throw new Error(`Unknown config key: ${key}`);
  },
} as unknown as ConfigService;

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(mockConfigService);
  });

  describe('validate', () => {
    it('maps sub, role, and subscriptionStatus to AuthenticatedUser shape', () => {
      const result = strategy.validate({
        sub: 'user-uuid',
        role: UserRole.USER,
        subscriptionStatus: SubscriptionStatus.FREE,
      });
      expect(result).toEqual({
        userId: 'user-uuid',
        role: UserRole.USER,
        subscriptionStatus: SubscriptionStatus.FREE,
      });
    });

    it('maps ADMIN role correctly', () => {
      const result = strategy.validate({
        sub: 'admin-uuid',
        role: UserRole.ADMIN,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });
      expect(result).toEqual({
        userId: 'admin-uuid',
        role: UserRole.ADMIN,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });
    });
  });
});
