// Tests for VerifyEmailPage — covers all three render states (loading, success, error) and the no-token case.
// Used by: app/(auth)/verify-email/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import VerifyEmailPage from './page';

const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const server = setupServer();
const Wrapper = createTestWrapper();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockGet.mockReset();
});
afterAll(() => server.close());

describe('VerifyEmailPage', () => {
  it('shows the error state immediately when no token is present in the URL', () => {
    mockGet.mockReturnValue(null);
    render(<VerifyEmailPage />, { wrapper: Wrapper });

    expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    expect(screen.getByText(/no verification token found/i)).toBeInTheDocument();
  });

  it('shows the loading state while the verification request is in flight', () => {
    mockGet.mockReturnValue('valid-token');
    server.use(
      http.post('*/auth/verify-email', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json({});
      }),
    );

    render(<VerifyEmailPage />, { wrapper: Wrapper });

    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('shows the success state after the token is verified', async () => {
    mockGet.mockReturnValue('valid-token');
    server.use(
      http.post('*/auth/verify-email', () =>
        HttpResponse.json({ data: { message: 'Email verified.' }, meta: {} }, { status: 200 }),
      ),
    );

    render(<VerifyEmailPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/email verified!/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
  });

  it('shows the error state with the API error message on verification failure', async () => {
    mockGet.mockReturnValue('expired-token');
    server.use(
      http.post('*/auth/verify-email', () =>
        HttpResponse.json({ message: 'Token has expired.' }, { status: 401 }),
      ),
    );

    render(<VerifyEmailPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/verification failed/i)).toBeInTheDocument());
    expect(screen.getByText(/token has expired/i)).toBeInTheDocument();
  });

  it('shows the fallback error message when the API response has no message field', async () => {
    mockGet.mockReturnValue('bad-token');
    server.use(http.post('*/auth/verify-email', () => HttpResponse.json({}, { status: 400 })));

    render(<VerifyEmailPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText(/this link has expired or is invalid/i)).toBeInTheDocument(),
    );
  });

  it('renders the resend form in the error state', async () => {
    mockGet.mockReturnValue(null);
    render(<VerifyEmailPage />, { wrapper: Wrapper });

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });
});
