// Category CRUD hooks — subset used during onboarding; full CRUD added in F10–F12.
// Used by: components/onboarding/onboarding-step1.tsx
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateCategoryDto, CreateSubcategoryDto } from '@grow-logs/schemas';
import type { Category, Subcategory } from '@grow-logs/types';

import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';

export interface ApiError {
  response?: { status: number; data: { message?: string } };
}

export interface CreateSubcategoryArgs extends CreateSubcategoryDto {
  categoryId: string;
}

export function useCategories(): UseQueryResult<Category[], ApiError> {
  return useQuery<Category[], ApiError>({
    queryKey: ['categories'],
    queryFn: () =>
      api
        .get<{ data: Category[]; meta: { total: number } }>('/categories')
        .then((r) => r.data.data),
  });
}

export function useCreateCategory(): UseMutationResult<Category, ApiError, CreateCategoryDto> {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, CreateCategoryDto>({
    mutationFn: (body) =>
      api
        .post<{ data: Category; meta: Record<string, never> }>('/categories', body)
        .then((r) => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteCategory(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.delete(`/categories/${id}`).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useCreateSubcategory(): UseMutationResult<
  Subcategory,
  ApiError,
  CreateSubcategoryArgs
> {
  const queryClient = useQueryClient();
  return useMutation<Subcategory, ApiError, CreateSubcategoryArgs>({
    mutationFn: ({ categoryId, ...body }) =>
      api
        .post<{
          data: Subcategory;
          meta: Record<string, never>;
        }>(`/categories/${categoryId}/subcategories`, body)
        .then((r) => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
