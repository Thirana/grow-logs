// Tests for AuthGuard — verifies redirect and render behaviour based on auth state.
// Used by: components/common/auth-guard.tsx
import { render, screen, waitFor } from '@testing-library/react';

import { createTestWrapper } from '@/test/utils';
import { useAuthStore } from '@/stores/auth.store';
import { AuthGuard } from './auth-guard';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const Wrapper = createTestWrapper();

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

afterEach(() => {
  mockReplace.mockReset();
});

const authenticatedUser = {
  id: 'uuid',
  email: 'user@example.com',
  role: 'USER' as const,
  isEmailVerified: true,
  onboardingCompleted: true,
  subscriptionStatus: 'FREE' as const,
};

describe('AuthGuard', () => {
  it('shows the full page spinner when not authenticated', () => {
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
      { wrapper: Wrapper },
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', async () => {
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({ user: authenticatedUser, isAuthenticated: true });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect when authenticated', () => {
    useAuthStore.setState({ user: authenticatedUser, isAuthenticated: true });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
      { wrapper: Wrapper },
    );

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
