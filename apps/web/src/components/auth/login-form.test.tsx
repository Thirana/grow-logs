// Tests for LoginForm — validates submit behaviour, redirect logic, and error handling.
// Used by: app/(auth)/login/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { useAuthStore } from '@/stores/auth.store';
import { LoginForm } from './login-form';

const mockReplace = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const server = setupServer();
const Wrapper = createTestWrapper();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockReplace.mockReset();
  mockGet.mockReturnValue(null);
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
afterAll(() => server.close());

function renderForm(): ReturnType<typeof render> {
  return render(<LoginForm />, { wrapper: Wrapper });
}

const loginSuccess = (onboardingCompleted: boolean) =>
  HttpResponse.json(
    {
      data: {
        accessToken: 'jwt-abc',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'USER',
          isEmailVerified: true,
          onboardingCompleted,
          subscriptionStatus: 'FREE',
        },
      },
      meta: {},
    },
    { status: 200 },
  );

describe('LoginForm', () => {
  it('renders email, password fields and the submit button', () => {
    renderForm();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows inline validation errors when submitted empty', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('redirects to /dashboard when onboardingCompleted is true', async () => {
    server.use(http.post('*/auth/login', () => loginSuccess(true)));
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('redirects to /onboarding when onboardingCompleted is false', async () => {
    server.use(http.post('*/auth/login', () => loginSuccess(false)));
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding'));
  });

  it('stores the user and access token in the auth store on success', async () => {
    server.use(http.post('*/auth/login', () => loginSuccess(true)));
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(useAuthStore.getState().user?.email).toBe('user@example.com');
  });

  it('shows "Invalid email or password." on 401 with generic message', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'WrongPass1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to the ?next= path instead of /dashboard after successful login', async () => {
    mockGet.mockReturnValue('/categories');
    server.use(http.post('*/auth/login', () => loginSuccess(true)));
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/categories'));
  });

  it('redirects to /check-email?resend=true when the account is not verified', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ message: 'Email not verified' }, { status: 401 }),
      ),
    );
    renderForm();

    await userEvent.type(screen.getByLabelText('Email address'), 'unverified@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/check-email?resend=true'));
  });
});
