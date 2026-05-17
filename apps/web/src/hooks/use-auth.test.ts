// Tests for useRegister — verifies the mutation calls the correct endpoint.
// Used by: hooks/use-auth.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { useRegister } from './use-auth';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
