// Tests for useCompleteOnboarding — verifies API call, store update, and redirect.
// Used by: hooks/use-onboarding.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useCompleteOnboarding } from './use-onboarding';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const server = setupServer();

beforeAll(() => server.listen());
beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'uuid',
      email: 'user@example.com',
      role: 'USER',
      isEmailVerified: true,
      onboardingCompleted: false,
      subscriptionStatus: 'FREE',
    },
    isAuthenticated: true,
  });
});
afterEach(() => {
  server.resetHandlers();
  mockReplace.mockReset();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
afterAll(() => server.close());

describe('useCompleteOnboarding', () => {
  it('posts to /onboarding/complete and resolves on 200', async () => {
    server.use(
      http.post('*/onboarding/complete', () =>
        HttpResponse.json(
          { data: { message: 'Onboarding completed.', onboardingCompleted: true }, meta: {} },
          { status: 200 },
        ),
      ),
    );

    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('sets onboardingCompleted to true in the auth store on success', async () => {
    server.use(
      http.post('*/onboarding/complete', () =>
        HttpResponse.json({
          data: { message: 'Onboarding completed.', onboardingCompleted: true },
          meta: {},
        }),
      ),
    );

    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user?.onboardingCompleted).toBe(true);
  });

  it('redirects to /dashboard on success', async () => {
    server.use(
      http.post('*/onboarding/complete', () =>
        HttpResponse.json({
          data: { message: 'Onboarding completed.', onboardingCompleted: true },
          meta: {},
        }),
      ),
    );

    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('enters error state on 409 (already completed)', async () => {
    server.use(
      http.post('*/onboarding/complete', () =>
        HttpResponse.json({ message: 'Onboarding already completed' }, { status: 409 }),
      ),
    );

    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(409);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
