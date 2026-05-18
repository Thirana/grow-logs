// Tests for RegisterForm — validates field errors, submit behaviour, and server error handling.
// Used by: app/(auth)/register/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { RegisterForm } from './register-form';

// next/navigation must be mocked in jsdom
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

// sonner toast does not render in jsdom — mock it so onError tests work
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const server = setupServer();
const Wrapper = createTestWrapper();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
});
afterAll(() => server.close());

function renderForm(): ReturnType<typeof render> {
  return render(<RegisterForm />, { wrapper: Wrapper });
}

describe('RegisterForm', () => {
  it('renders all three fields and the submit button', () => {
    renderForm();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows inline errors when form is submitted empty', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows a password mismatch error when passwords differ', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText('Email address'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Different1!');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('redirects to /check-email on successful registration', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          { data: { message: 'Registration successful.' }, meta: {} },
          { status: 201 },
        ),
      ),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText('Email address'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/check-email'));
  });

  it('shows inline email error on 409 conflict', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText('Email address'), 'taken@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    });
  });
});
