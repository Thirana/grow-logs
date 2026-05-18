import axios from 'axios';
import { env } from '@/lib/env';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public auth endpoints must not trigger a token refresh on 401 — the error
// is intentional (wrong credentials, unverified email) and must reach the caller.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuth) {
      originalRequest._retry = true;

      try {
        await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        // Clear all session state before redirecting — this prevents middleware from
        // bouncing the user back to the protected route when _gl_session is still set.
        clearSessionCookie();
        clearAccessToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// Persisted in sessionStorage so the token survives same-tab page reloads.
// sessionStorage is cleared when the tab closes, providing natural session expiry.
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;

export function setAccessToken(token: string): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('_gl_access_token', token);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('_gl_access_token');
  }
}

function clearSessionCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
  }
}
