// Entry data hooks — summary (F06), list (F07), create/update/delete (F08/F09).
// Used by: components/dashboard/dashboard-client.tsx, components/dashboard/entry-sheet.tsx, components/dashboard/delete-entry-dialog.tsx
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { Entry, EntryListMeta, EntrySummary } from '@grow-logs/types';
import type { CreateEntryDto, UpdateEntryDto } from '@grow-logs/schemas';

import { api } from '@/lib/api';
import type { ApiError } from '@/hooks/use-categories';

export interface EntryListParams {
  page?: number;
  limit?: number;
  type?: 'WORK' | 'LEARNING';
  categoryId?: string;
  from?: string;
  to?: string;
}

export function useEntriesSummary(
  period: EntrySummary['period'],
): UseQueryResult<EntrySummary, ApiError> {
  return useQuery<EntrySummary, ApiError>({
    queryKey: ['entries', 'summary', period],
    queryFn: () =>
      api
        .get<{ data: EntrySummary; meta: Record<string, never> }>('/entries/summary', {
          params: { period },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useEntries(
  params: EntryListParams,
): UseQueryResult<{ data: Entry[]; meta: EntryListMeta }, ApiError> {
  return useQuery<{ data: Entry[]; meta: EntryListMeta }, ApiError>({
    queryKey: ['entries', params],
    queryFn: () =>
      api.get<{ data: Entry[]; meta: EntryListMeta }>('/entries', { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateEntry(): UseMutationResult<Entry, ApiError, CreateEntryDto> {
  const queryClient = useQueryClient();
  return useMutation<Entry, ApiError, CreateEntryDto>({
    mutationFn: (data) =>
      api
        .post<{ data: Entry; meta: Record<string, never> }>('/entries', data)
        .then((r) => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}

interface UpdateEntryArgs {
  id: string;
  data: UpdateEntryDto;
}

export function useUpdateEntry(): UseMutationResult<Entry, ApiError, UpdateEntryArgs> {
  const queryClient = useQueryClient();
  return useMutation<Entry, ApiError, UpdateEntryArgs>({
    mutationFn: ({ id, data }) =>
      api
        .patch<{ data: Entry; meta: Record<string, never> }>(`/entries/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}

export function useDeleteEntry(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.delete(`/entries/${id}`).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
