// Tests for OnboardingStep3 — completion summary, complete mutation, and redirect.
// Used by: app/(onboarding)/onboarding/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { useAuthStore } from '@/stores/auth.store';
import { OnboardingStep3 } from './onboarding-step3';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const server = setupServer();
const Wrapper = createTestWrapper();

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

function renderStep(count: number) {
  return render(<OnboardingStep3 categoryCount={count} />, { wrapper: Wrapper });
}

describe('OnboardingStep3', () => {
  it('shows "category" (singular) when count is 1', () => {
    renderStep(1);
    expect(screen.getByText(/1 category created/i)).toBeInTheDocument();
  });

  it('shows "categories" (plural) when count is 3', () => {
    renderStep(3);
    expect(screen.getByText(/3 categories created/i)).toBeInTheDocument();
  });

  it('renders the Go to dashboard button', () => {
    renderStep(2);
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('calls POST /onboarding/complete when the button is clicked', async () => {
    let called = false;
    server.use(
      http.post('*/onboarding/complete', () => {
        called = true;
        return HttpResponse.json({
          data: { message: 'Onboarding completed.', onboardingCompleted: true },
          meta: {},
        });
      }),
    );

    renderStep(2);

    await userEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));

    await waitFor(() => expect(called).toBe(true));
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

    renderStep(2);

    await userEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });

  it('disables the button and shows a spinner while the mutation is in flight', async () => {
    server.use(
      http.post('*/onboarding/complete', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({
          data: { message: 'Onboarding completed.', onboardingCompleted: true },
          meta: {},
        });
      }),
    );

    renderStep(2);

    const btn = screen.getByRole('button', { name: /go to dashboard/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /setting up/i })).toBeDisabled();
    });
  });
});
