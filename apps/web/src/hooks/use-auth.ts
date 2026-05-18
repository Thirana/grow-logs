// Auth hooks — mutations and queries for registration, login, session, and email verification.
// Used by: components/auth/register-form, login-form, verify-email-content, resend-verification-form, auth-guard
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { RegisterDto, LoginDto, ResendVerificationDto } from '@grow-logs/schemas';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface ApiError {
  response?: {
    status: number;
    data: { message?: string; errors?: unknown[] };
  };
}

interface RegisterResponse {
  data: { message: string };
  meta: Record<string, never>;
}

export interface LoginUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
}

interface LoginResponse {
  data: {
    accessToken: string;
    user: LoginUser;
  };
  meta: Record<string, never>;
}

interface VerifyEmailResponse {
  data: { message: string };
  meta: Record<string, never>;
}

interface ResendResponse {
  data: { message: string };
  meta: Record<string, never>;
}

export function useRegister(): UseMutationResult<RegisterResponse, ApiError, RegisterDto> {
  return useMutation<RegisterResponse, ApiError, RegisterDto>({
    mutationFn: (body) => api.post<RegisterResponse>('/auth/register', body).then((r) => r.data),
  });
}

export function useLogin(): UseMutationResult<LoginResponse, ApiError, LoginDto> {
  return useMutation<LoginResponse, ApiError, LoginDto>({
    mutationFn: (body) => api.post<LoginResponse>('/auth/login', body).then((r) => r.data),
  });
}

export function useLogout(): UseMutationResult<void, ApiError, void> {
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation<void, ApiError, void>({
    mutationFn: () => api.post('/auth/logout').then(() => undefined),
    onSuccess: () => {
      logout();
      router.push('/login');
    },
  });
}

export function useVerifyEmail(token: string): UseQueryResult<VerifyEmailResponse, ApiError> {
  return useQuery<VerifyEmailResponse, ApiError>({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () =>
      api.post<VerifyEmailResponse>('/auth/verify-email', { token }).then((r) => r.data),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResendVerification(): UseMutationResult<
  ResendResponse,
  ApiError,
  ResendVerificationDto
> {
  return useMutation<ResendResponse, ApiError, ResendVerificationDto>({
    mutationFn: (body) =>
      api.post<ResendResponse>('/auth/resend-verification', body).then((r) => r.data),
  });
}

interface MeResponse {
  data: {
    id: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
    subscriptionStatus: string;
  };
  meta: object;
}

// Restores the session after a page reload. The access token is already recovered
// from sessionStorage by lib/api.ts at module load, so GET /users/me will succeed
// if the token is still valid (< 1 hour old). On 401, the Axios response interceptor
// clears _gl_session and redirects to /login, breaking the middleware redirect loop.
export function useRestoreSession(): UseQueryResult<LoginUser, ApiError> {
  const { isAuthenticated } = useAuthStore();

  const hasSessionCookie =
    typeof document !== 'undefined' && document.cookie.includes('_gl_session=1');

  return useQuery<LoginUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<MeResponse>('/users/me');
      const p = res.data.data;
      const user: LoginUser = {
        id: p.id,
        email: p.email,
        role: p.role as LoginUser['role'],
        isEmailVerified: p.isEmailVerified,
        onboardingCompleted: p.onboardingCompleted,
        subscriptionStatus: p.subscriptionStatus as LoginUser['subscriptionStatus'],
      };
      useAuthStore.getState().restoreSession(user);
      return user;
    },
    enabled: !isAuthenticated && hasSessionCookie,
    retry: false,
    staleTime: Infinity,
  });
}
