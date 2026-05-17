// Tests for ResendVerificationForm — validates form behaviour and success confirmation.
// Used by: components/auth/resend-verification-form.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { ResendVerificationForm } from './resend-verification-form';

const server = setupServer();
const Wrapper = createTestWrapper();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderForm(props: { initialEmail?: string } = {}): ReturnType<typeof render> {
  return render(<ResendVerificationForm {...props} />, { wrapper: Wrapper });
}

describe('ResendVerificationForm', () => {
  it('renders the email field and submit button', () => {
    renderForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });

  it('pre-fills the email field from the initialEmail prop', () => {
    renderForm({ initialEmail: 'prefilled@example.com' });
    expect(screen.getByLabelText(/email address/i)).toHaveValue('prefilled@example.com');
  });

  it('shows a validation error when submitted with an invalid email', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows confirmation text and hides the form on success', async () => {
    server.use(
      http.post('*/auth/resend-verification', () =>
        HttpResponse.json({ data: { message: 'Sent.' }, meta: {} }, { status: 200 }),
      ),
    );

    renderForm();
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => expect(screen.getByText(/verification email sent/i)).toBeInTheDocument());
    expect(
      screen.queryByRole('button', { name: /resend verification email/i }),
    ).not.toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight', async () => {
    server.use(
      http.post('*/auth/resend-verification', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ data: { message: 'Sent.' }, meta: {} });
      }),
    );

    renderForm();
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled();
  });
});
