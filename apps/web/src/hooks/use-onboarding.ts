// Onboarding completion hook — marks the user onboarded and redirects to the dashboard.
// Used by: components/onboarding/onboarding-step2.tsx
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface ApiError {
  response?: { status: number; data: { message?: string } };
}

interface CompleteOnboardingResponse {
  data: { message: string; onboardingCompleted: boolean };
  meta: Record<string, never>;
}

export function useCompleteOnboarding(): UseMutationResult<
  CompleteOnboardingResponse,
  ApiError,
  void
> {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  return useMutation<CompleteOnboardingResponse, ApiError, void>({
    mutationFn: () =>
      api.post<CompleteOnboardingResponse>('/onboarding/complete', {}).then((r) => r.data),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, onboardingCompleted: true });
      }
      void router.replace('/dashboard');
    },
  });
}
