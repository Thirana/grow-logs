// Tests for OnboardingStep2 — subcategory creation per category, category tab switching, and continue.
// Used by: app/(onboarding)/onboarding/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { OnboardingStep2 } from './onboarding-step2';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockSubcategory = (id: string, name: string, categoryId = 'cat-1') => ({
  id,
  name,
  categoryId,
  isCompleted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
});

const mockCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Backend Development',
  color: '#8285BA',
  isCompleted: false,
  subcategories: [],
  entryCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

function setupCategoriesEndpoint(categories: ReturnType<typeof mockCategory>[] = []) {
  server.use(
    http.get('*/categories', () =>
      HttpResponse.json({ data: categories, meta: { total: categories.length } }),
    ),
  );
}

function renderStep(onContinue = vi.fn()) {
  // Fresh QueryClient per test prevents cache leaking between tests
  return render(<OnboardingStep2 onContinue={onContinue} />, { wrapper: createTestWrapper() });
}

describe('OnboardingStep2', () => {
  it('renders the subcategories heading', () => {
    setupCategoriesEndpoint([]);
    renderStep();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows all categories as tabs in the left sidebar', async () => {
    setupCategoriesEndpoint([
      mockCategory({ id: 'cat-1', name: 'Backend Development' }),
      mockCategory({ id: 'cat-2', name: 'DevOps & Cloud', color: '#62AEBF' }),
    ]);
    renderStep();

    // DevOps & Cloud is unique to the sidebar tab (not shown in right panel or suggestions)
    await waitFor(() => {
      expect(screen.getByText('DevOps & Cloud')).toBeInTheDocument();
    });
    // Backend Development appears in both the active tab and the right panel header
    expect(screen.getAllByText('Backend Development').length).toBeGreaterThan(0);
  });

  it('shows the subcategory input for the active category', async () => {
    setupCategoriesEndpoint([mockCategory()]);
    renderStep();

    await waitFor(() => {
      expect(screen.getByLabelText('Subcategory name')).toBeInTheDocument();
    });
  });

  it('shows suggestions for a known category name', async () => {
    setupCategoriesEndpoint([mockCategory({ name: 'Backend Development' })]);
    renderStep();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Node\.js/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add REST APIs/i })).toBeInTheDocument();
    });
  });

  it('clicking a suggestion chip posts a subcategory immediately', async () => {
    let subcatPosted = false;
    setupCategoriesEndpoint([mockCategory({ name: 'Backend Development' })]);
    server.use(
      http.post('*/categories/cat-1/subcategories', () => {
        subcatPosted = true;
        return HttpResponse.json(
          { data: mockSubcategory('sub-1', 'Node.js'), meta: {} },
          { status: 201 },
        );
      }),
    );

    renderStep();

    // Wait for the category to load and the suggestion chip to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Node.js' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Add Node.js' }));

    await waitFor(() => expect(subcatPosted).toBe(true));
  });

  it('creates a subcategory from the custom input when Add is clicked', async () => {
    let subcatPosted = false;
    setupCategoriesEndpoint([mockCategory()]);
    server.use(
      http.post('*/categories/cat-1/subcategories', () => {
        subcatPosted = true;
        return HttpResponse.json(
          { data: mockSubcategory('sub-2', 'GraphQL'), meta: {} },
          { status: 201 },
        );
      }),
    );

    renderStep();

    await waitFor(() => expect(screen.getByLabelText('Subcategory name')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Subcategory name'), 'GraphQL');
    await userEvent.click(screen.getByRole('button', { name: 'Add subcategory' }));

    await waitFor(() => expect(subcatPosted).toBe(true));
  });

  it('creates a subcategory when Enter is pressed in the input', async () => {
    let callCount = 0;
    setupCategoriesEndpoint([mockCategory()]);
    server.use(
      http.post('*/categories/cat-1/subcategories', () => {
        callCount++;
        return HttpResponse.json(
          { data: mockSubcategory('sub-3', 'Docker'), meta: {} },
          { status: 201 },
        );
      }),
    );

    renderStep();

    await waitFor(() => expect(screen.getByLabelText('Subcategory name')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Subcategory name'), 'Docker');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(callCount).toBe(1));
  });

  it('switches active category when a different tab is clicked', async () => {
    setupCategoriesEndpoint([
      mockCategory({ id: 'cat-1', name: 'Backend Development' }),
      mockCategory({ id: 'cat-2', name: 'DevOps & Cloud', color: '#62AEBF' }),
    ]);
    renderStep();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /DevOps & Cloud/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /DevOps & Cloud/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Docker/i })).toBeInTheDocument();
    });
  });

  it('calls onContinue with the category count when Continue is clicked', async () => {
    setupCategoriesEndpoint([
      mockCategory({ id: 'cat-1', name: 'Backend Development' }),
      mockCategory({ id: 'cat-2', name: 'DevOps & Cloud', color: '#62AEBF' }),
    ]);
    const onContinue = vi.fn();
    renderStep(onContinue);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to finish/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /continue to finish/i }));

    expect(onContinue).toHaveBeenCalledWith(2);
  });

  it('shows the subcategory count badge on a category tab after subcategories are added', async () => {
    setupCategoriesEndpoint([
      mockCategory({
        id: 'cat-1',
        name: 'Backend Development',
        subcategories: [mockSubcategory('sub-1', 'Node.js'), mockSubcategory('sub-2', 'REST APIs')],
      }),
    ]);
    renderStep();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
