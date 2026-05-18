// Tests for OnboardingStep1 — category creation and suggestion chips only (subcategories moved to step 2).
// Used by: app/(onboarding)/onboarding/page.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createTestWrapper } from '@/test/utils';
import { OnboardingStep1 } from './onboarding-step1';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const server = setupServer();
const Wrapper = createTestWrapper();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockCategory = (overrides = {}) => ({
  id: 'cat-uuid',
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
  return render(<OnboardingStep1 onContinue={onContinue} />, { wrapper: Wrapper });
}

describe('OnboardingStep1', () => {
  it('renders the heading, suggestion chips, and category input', async () => {
    setupCategoriesEndpoint([]);
    renderStep();

    expect(screen.getByText(/choose your/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Category name')).toBeInTheDocument();
    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.getByText('Backend Development')).toBeInTheDocument();
  });

  it('does not render the subcategory input (subcategories are step 2)', async () => {
    setupCategoriesEndpoint([mockCategory()]);
    renderStep();

    await waitFor(() => {
      expect(screen.queryByLabelText('Subcategory name')).not.toBeInTheDocument();
    });
  });

  it('disables the Continue button when no categories exist', async () => {
    setupCategoriesEndpoint([]);
    renderStep();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    });
  });

  it('creates a category when the Add button is clicked', async () => {
    let posted = false;
    setupCategoriesEndpoint([]);
    server.use(
      http.post('*/categories', () => {
        posted = true;
        return HttpResponse.json({ data: mockCategory(), meta: {} }, { status: 201 });
      }),
    );

    renderStep();

    await userEvent.type(screen.getByLabelText('Category name'), 'Backend Development');
    await userEvent.click(screen.getByRole('button', { name: 'Add category' }));

    await waitFor(() => expect(posted).toBe(true));
  });

  it('creates a category when Enter is pressed in the input', async () => {
    let callCount = 0;
    setupCategoriesEndpoint([]);
    server.use(
      http.post('*/categories', () => {
        callCount++;
        return HttpResponse.json({ data: mockCategory(), meta: {} }, { status: 201 });
      }),
    );

    renderStep();

    await userEvent.type(screen.getByLabelText('Category name'), 'My Category');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(callCount).toBe(1));
  });

  it('one-click suggestion creates a category immediately', async () => {
    let posted = false;
    setupCategoriesEndpoint([]);
    server.use(
      http.post('*/categories', () => {
        posted = true;
        return HttpResponse.json(
          { data: mockCategory({ name: 'Frontend Development', color: '#69B598' }), meta: {} },
          { status: 201 },
        );
      }),
    );

    renderStep();

    await userEvent.click(screen.getByRole('button', { name: /Frontend Development/i }));

    await waitFor(() => expect(posted).toBe(true));
  });

  it('shows the Continue button enabled and calls onContinue after a category is created', async () => {
    setupCategoriesEndpoint([mockCategory()]);
    const onContinue = vi.fn();
    renderStep(onContinue);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalled();
  });

  it('marks a suggestion chip as added when that category already exists', async () => {
    setupCategoriesEndpoint([mockCategory({ name: 'Backend Development' })]);
    renderStep();

    await waitFor(() => {
      // The suggestion chip has aria-pressed; the remove button does not
      const chip = screen.getByRole('button', { name: /Backend Development/i, pressed: true });
      expect(chip).toBeDisabled();
    });
  });
});
