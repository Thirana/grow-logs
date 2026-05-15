import { http, HttpResponse } from 'msw';

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Backend Development',
    color: '#6366f1',
    subcategories: [{ id: 'sub-1', name: 'NestJS' }],
  },
  {
    id: 'cat-2',
    name: 'Frontend Development',
    color: '#f59e0b',
    subcategories: [{ id: 'sub-2', name: 'React' }],
  },
];

export const categoriesHandlers = [
  http.get('*/categories', () => {
    return HttpResponse.json({
      data: mockCategories,
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  http.post('*/categories', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { data: { id: 'new-cat-id', subcategories: [], ...body }, meta: {} },
      { status: 201 },
    );
  }),

  http.patch('*/categories/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const category = mockCategories.find((c) => c.id === params.id);
    return HttpResponse.json({ data: { ...category, ...body }, meta: {} });
  }),

  http.delete('*/categories/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
