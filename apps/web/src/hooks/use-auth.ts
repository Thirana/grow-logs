// Auth hooks — mutations for registration, login, and session management.
// Used by: components/auth/register-form, components/auth/login-form, etc.
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { RegisterDto, LoginDto } from '@grow-logs/schemas';

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
