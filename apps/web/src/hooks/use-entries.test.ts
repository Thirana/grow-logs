// Tests for useEntriesSummary, useEntries, useCreateEntry, useUpdateEntry, useDeleteEntry.
// Used by: hooks/use-entries.ts
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import {
  useEntriesSummary,
  useEntries,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
} from './use-entries';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_SUMMARY = {
  period: '30d' as const,
  totalEntries: 42,
  totalByType: { WORK: 28, LEARNING: 14 },
  averageProductivityScore: 7.4,
  thisWeekCount: 8,
  lastWeekCount: 5,
  currentStreak: 9,
  longestStreak: 23,
  byCategory: [],
  dailyActivity: [],
  weeklyTrend: [],
};

const MOCK_ENTRY = {
  id: 'e1',
  userId: 'u1',
  type: 'WORK' as const,
  text: 'Implemented auth guard.',
  productivityScore: 8,
  entryDate: '2025-05-14',
  categoryId: 'c1',
  subcategoryId: 's1',
  category: { id: 'c1', name: 'Backend', color: '#69B598' },
  subcategory: { id: 's1', name: 'NestJS' },
  createdAt: '2025-05-14T10:00:00Z',
  updatedAt: '2025-05-14T10:00:00Z',
};

const MOCK_META = { total: 1, page: 1, limit: 10, totalPages: 1 };

describe('useEntriesSummary', () => {
  it('returns summary data on 200', async () => {
    server.use(
      http.get('*/entries/summary', () => HttpResponse.json({ data: MOCK_SUMMARY, meta: {} })),
    );

    const { result } = renderHook(() => useEntriesSummary('30d'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalEntries).toBe(42);
    expect(result.current.data?.period).toBe('30d');
    expect(result.current.data?.currentStreak).toBe(9);
  });

  it('enters error state on 401', async () => {
    server.use(
      http.get('*/entries/summary', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useEntriesSummary('7d'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('sends the period as a query param', async () => {
    let capturedPeriod: string | null = null;
    server.use(
      http.get('*/entries/summary', ({ request }) => {
        capturedPeriod = new URL(request.url).searchParams.get('period');
        return HttpResponse.json({ data: { ...MOCK_SUMMARY, period: capturedPeriod }, meta: {} });
      }),
    );

    const { result } = renderHook(() => useEntriesSummary('7d'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedPeriod).toBe('7d');
  });
});

describe('useEntries', () => {
  it('returns entry list and meta on 200', async () => {
    server.use(
      http.get('*/entries', () => HttpResponse.json({ data: [MOCK_ENTRY], meta: MOCK_META })),
    );

    const { result } = renderHook(() => useEntries({ page: 1, limit: 10 }), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].type).toBe('WORK');
    expect(result.current.data?.meta.total).toBe(1);
  });

  it('enters error state on 401', async () => {
    server.use(
      http.get('*/entries', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
    );

    const { result } = renderHook(() => useEntries({}), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('sends page and limit as query params', async () => {
    let capturedPage: string | null = null;
    let capturedLimit: string | null = null;
    server.use(
      http.get('*/entries', ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');
        capturedLimit = url.searchParams.get('limit');
        return HttpResponse.json({ data: [], meta: { ...MOCK_META, total: 0 } });
      }),
    );

    const { result } = renderHook(() => useEntries({ page: 2, limit: 5 }), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedPage).toBe('2');
    expect(capturedLimit).toBe('5');
  });
});

const CREATE_PAYLOAD = {
  type: 'WORK' as const,
  text: 'Implemented the auth guard refactor and cleaned tests.',
  categoryId: 'c1',
  entryDate: '2025-05-14',
  productivityScore: 8,
};

describe('useCreateEntry', () => {
  it('returns created entry on 201', async () => {
    server.use(
      http.post('*/entries', () =>
        HttpResponse.json({ data: MOCK_ENTRY, meta: {} }, { status: 201 }),
      ),
    );

    const { result } = renderHook(() => useCreateEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('e1');
    expect(result.current.data?.type).toBe('WORK');
    expect(result.current.data?.productivityScore).toBe(8);
  });

  it('enters error state on 422', async () => {
    server.use(
      http.post('*/entries', () =>
        HttpResponse.json({ message: 'Daily entry limit reached' }, { status: 422 }),
      ),
    );

    const { result } = renderHook(() => useCreateEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(422);
  });
});

describe('useUpdateEntry', () => {
  it('returns updated entry on 200', async () => {
    const updated = { ...MOCK_ENTRY, productivityScore: 9, text: 'Updated the auth guard.' };
    server.use(http.patch('*/entries/e1', () => HttpResponse.json({ data: updated, meta: {} })));

    const { result } = renderHook(() => useUpdateEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: 'e1',
        data: { text: 'Updated the auth guard.', productivityScore: 9 },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.productivityScore).toBe(9);
    expect(result.current.data?.id).toBe('e1');
  });

  it('enters error state on 404', async () => {
    server.use(
      http.patch('*/entries/missing', () =>
        HttpResponse.json({ message: 'Entry not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useUpdateEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'missing', data: { text: 'Some updated text here.' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(404);
  });
});

describe('useDeleteEntry', () => {
  it('succeeds on 204', async () => {
    server.use(http.delete('*/entries/e1', () => new HttpResponse(null, { status: 204 })));

    const { result } = renderHook(() => useDeleteEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate('e1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('enters error state on 404', async () => {
    server.use(
      http.delete('*/entries/missing', () =>
        HttpResponse.json({ message: 'Entry not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useDeleteEntry(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate('missing');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(404);
  });
});
