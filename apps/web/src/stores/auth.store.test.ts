import { useAuthStore } from './auth.store';
import { getAccessToken, clearAccessToken } from '@/lib/api';

const mockUser = {
  id: 'user-uuid',
  email: 'user@example.com',
  role: 'USER' as const,
  isEmailVerified: true,
  onboardingCompleted: false,
  subscriptionStatus: 'FREE' as const,
};

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
  clearAccessToken();
});

describe('useAuthStore', () => {
  it('starts unauthenticated with no user', () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  describe('login', () => {
    it('sets the user, marks as authenticated, and stores the access token', () => {
      useAuthStore.getState().login(mockUser, 'jwt-token-abc');

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
      expect(getAccessToken()).toBe('jwt-token-abc');
    });
  });

  describe('logout', () => {
    it('clears the user, marks as unauthenticated, and removes the access token', () => {
      useAuthStore.getState().login(mockUser, 'jwt-token-abc');
      useAuthStore.getState().logout();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('setUser', () => {
    it('updates the user without changing isAuthenticated', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      useAuthStore.getState().setUser(updatedUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user?.email).toBe('updated@example.com');
      expect(isAuthenticated).toBe(true);
    });
  });
});
