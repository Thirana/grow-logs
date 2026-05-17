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
        clearAccessToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

let accessToken: string | null = null;

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}
