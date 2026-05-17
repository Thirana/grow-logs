// Tests for auth hooks — verifies each mutation calls the correct endpoint.
// Used by: hooks/use-auth.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import {
  useRegister,
  useLogin,
  useLogout,
  useVerifyEmail,
  useResendVerification,
} from './use-auth';
import { useAuthStore } from '@/stores/auth.store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
afterAll(() => server.close());

const loginSuccessBody = {
  data: {
    accessToken: 'jwt-abc',
    user: {
      id: 'uuid',
      email: 'user@example.com',
      role: 'USER',
      isEmailVerified: true,
      onboardingCompleted: true,
      subscriptionStatus: 'FREE',
    },
  },
  meta: {},
};

describe('useRegister', () => {
  it('resolves with the API response on 201', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          { data: { message: 'Registration successful.' }, meta: {} },
          { status: 201 },
        ),
      ),
    );

    const { result } = renderHook(() => useRegister(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.message).toBe('Registration successful.');
  });

  it('rejects with an error on 409', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    );

    const { result } = renderHook(() => useRegister(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'taken@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(409);
  });
});

describe('useLogin', () => {
  it('resolves with access token and user on 200', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json(loginSuccessBody, { status: 200 })),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com', password: 'Password1!' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.accessToken).toBe('jwt-abc');
    expect(result.current.data?.data.user.email).toBe('user@example.com');
  });

  it('rejects with 401 on wrong credentials', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com', password: 'WrongPass1!' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(401);
  });
});

describe('useVerifyEmail', () => {
  it('posts the token and resolves with the API response on 200', async () => {
    server.use(
      http.post('*/auth/verify-email', () =>
        HttpResponse.json({ data: { message: 'Email verified.' }, meta: {} }, { status: 200 }),
      ),
    );

    const { result } = renderHook(() => useVerifyEmail('valid-token'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.message).toBe('Email verified.');
  });

  it('does not fire when the token is empty', () => {
    const { result } = renderHook(() => useVerifyEmail(''), { wrapper: createTestWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });

  it('rejects on 401 and does not retry', async () => {
    let callCount = 0;
    server.use(
      http.post('*/auth/verify-email', () => {
        callCount++;
        return HttpResponse.json({ message: 'Token expired.' }, { status: 401 });
      }),
    );

    const { result } = renderHook(() => useVerifyEmail('expired-token'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(callCount).toBe(1);
  });
});

describe('useResendVerification', () => {
  it('posts the email address and resolves on 200', async () => {
    server.use(
      http.post('*/auth/resend-verification', () =>
        HttpResponse.json({ data: { message: 'Email sent.' }, meta: {} }, { status: 200 }),
      ),
    );

    const { result } = renderHook(() => useResendVerification(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.message).toBe('Email sent.');
  });
});

describe('useLogout', () => {
  it('calls POST /auth/logout, clears the auth store, and redirects to /login', async () => {
    server.use(
      http.post('*/auth/logout', () =>
        HttpResponse.json({ data: { message: 'Logged out successfully.' }, meta: {} }),
      ),
    );

    useAuthStore.setState({
      user: {
        id: 'uuid',
        email: 'user@example.com',
        role: 'USER',
        isEmailVerified: true,
        onboardingCompleted: true,
        subscriptionStatus: 'FREE',
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useLogout(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
