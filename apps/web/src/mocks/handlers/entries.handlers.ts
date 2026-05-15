import { http, HttpResponse } from 'msw';

const mockEntries = [
  {
    id: 'entry-1',
    title: 'Set up NestJS project',
    content: 'Bootstrapped the NestJS backend with Prisma and PostgreSQL.',
    type: 'WORK',
    productivityScore: 8,
    entryDate: '2026-05-14',
    categoryId: 'cat-1',
    subcategoryId: null,
    createdAt: '2026-05-14T10:00:00Z',
    updatedAt: '2026-05-14T10:00:00Z',
  },
  {
    id: 'entry-2',
    title: 'Learned React Query v5',
    content: 'Explored the new TanStack Query v5 API and migration guide.',
    type: 'LEARNING',
    productivityScore: 9,
    entryDate: '2026-05-13',
    categoryId: 'cat-2',
    subcategoryId: null,
    createdAt: '2026-05-13T14:00:00Z',
    updatedAt: '2026-05-13T14:00:00Z',
  },
];

export const entriesHandlers = [
  http.get('*/entries', () => {
    return HttpResponse.json({
      data: mockEntries,
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  http.get('*/entries/:id', ({ params }) => {
    const entry = mockEntries.find((e) => e.id === params.id);
    if (!entry) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ data: entry, meta: {} });
  }),

  http.post('*/entries', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        data: { id: 'new-entry-id', ...body, createdAt: new Date().toISOString() },
        meta: {},
      },
      { status: 201 },
    );
  }),

  http.patch('*/entries/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = mockEntries.find((e) => e.id === params.id);
    return HttpResponse.json({ data: { ...entry, ...body }, meta: {} });
  }),

  http.delete('*/entries/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
