// Tests for category hooks — verifies each hook calls the correct endpoint.
// Used by: hooks/use-categories.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useCreateSubcategory,
} from './use-categories';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockCategory = {
  id: 'cat-uuid',
  name: 'Backend Development',
  color: '#8285BA',
  isCompleted: false,
  subcategories: [],
  entryCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockSubcategory = {
  id: 'sub-uuid',
  name: 'NestJS',
  categoryId: 'cat-uuid',
  isCompleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('useCategories', () => {
  it('fetches and returns the data array on 200', async () => {
    server.use(
      http.get('*/categories', () =>
        HttpResponse.json({ data: [mockCategory], meta: { total: 1 } }),
      ),
    );

    const { result } = renderHook(() => useCategories(), { wrapper: createTestWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Backend Development');
  });

  it('enters error state on 401', async () => {
    server.use(
      http.get('*/categories', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useCategories(), { wrapper: createTestWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateCategory', () => {
  it('posts to /categories and resolves with the created category', async () => {
    server.use(
      http.post('*/categories', () =>
        HttpResponse.json({ data: mockCategory, meta: {} }, { status: 201 }),
      ),
    );

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ name: 'Backend Development', color: '#8285BA' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Backend Development');
  });

  it('enters error state on 409 (duplicate name)', async () => {
    server.use(
      http.post('*/categories', () =>
        HttpResponse.json({ message: 'Name already exists' }, { status: 409 }),
      ),
    );

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ name: 'Duplicate' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(409);
  });
});

describe('useDeleteCategory', () => {
  it('sends DELETE /categories/:id and resolves on 204', async () => {
    server.use(http.delete('*/categories/cat-uuid', () => new HttpResponse(null, { status: 204 })));

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate('cat-uuid');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('enters error state on 422 (category has entries)', async () => {
    server.use(
      http.delete('*/categories/cat-uuid', () =>
        HttpResponse.json({ message: 'Category has entries' }, { status: 422 }),
      ),
    );

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate('cat-uuid');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(422);
  });
});

describe('useCreateSubcategory', () => {
  it('posts to /categories/:id/subcategories and resolves with the created subcategory', async () => {
    server.use(
      http.post('*/categories/cat-uuid/subcategories', () =>
        HttpResponse.json({ data: mockSubcategory, meta: {} }, { status: 201 }),
      ),
    );

    const { result } = renderHook(() => useCreateSubcategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ categoryId: 'cat-uuid', name: 'NestJS' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('NestJS');
    expect(result.current.data?.categoryId).toBe('cat-uuid');
  });

  it('enters error state on 409 (duplicate subcategory name)', async () => {
    server.use(
      http.post('*/categories/cat-uuid/subcategories', () =>
        HttpResponse.json({ message: 'Subcategory name exists' }, { status: 409 }),
      ),
    );

    const { result } = renderHook(() => useCreateSubcategory(), { wrapper: createTestWrapper() });

    await act(async () => {
      result.current.mutate({ categoryId: 'cat-uuid', name: 'NestJS' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(409);
  });
});
