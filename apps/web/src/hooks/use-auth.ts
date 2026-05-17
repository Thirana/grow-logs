// Auth hooks — mutations for registration, login, and session management.
// Used by: components/auth/register-form, components/auth/login-form, etc.
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { RegisterDto } from '@grow-logs/schemas';

import { api } from '@/lib/api';

interface RegisterResponse {
  data: { message: string };
  meta: Record<string, never>;
}

interface ApiError {
  response?: {
    status: number;
    data: { message?: string; errors?: unknown[] };
  };
}

export function useRegister(): UseMutationResult<RegisterResponse, ApiError, RegisterDto> {
  return useMutation<RegisterResponse, ApiError, RegisterDto>({
    mutationFn: (body) => api.post<RegisterResponse>('/auth/register', body).then((r) => r.data),
  });
}
