import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('*/auth/register', () => {
    return HttpResponse.json(
      {
        data: {
          message: 'Registration successful. Please check your email to verify your account.',
        },
        meta: {},
      },
      { status: 201 },
    );
  }),

  http.post('*/auth/login', () => {
    return HttpResponse.json(
      {
        data: {
          accessToken: 'mock-access-token',
          user: {
            id: 'mock-user-id',
            email: 'user@example.com',
            name: 'Test User',
            role: 'USER',
            isVerified: true,
          },
        },
        meta: {},
      },
      { status: 200 },
    );
  }),

  http.post('*/auth/logout', () => {
    return HttpResponse.json({ data: null, meta: {} }, { status: 200 });
  }),

  http.post('*/auth/refresh', () => {
    return HttpResponse.json(
      { data: { accessToken: 'mock-refreshed-token' }, meta: {} },
      { status: 200 },
    );
  }),
];
