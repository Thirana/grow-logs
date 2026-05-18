// Entry data hooks — summary (F06) and list (F07).
// Used by: components/dashboard/dashboard-client.tsx
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Entry, EntryListMeta, EntrySummary } from '@grow-logs/types';

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
