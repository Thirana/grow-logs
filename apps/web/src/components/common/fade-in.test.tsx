import { render, screen, act } from '@testing-library/react';
import { FadeIn } from './fade-in';

let capturedCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn((cb: IntersectionObserverCallback) => {
      capturedCallback = cb;
      return { observe: mockObserve, disconnect: mockDisconnect };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FadeIn', () => {
  it('renders its children', () => {
    render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('starts hidden — opacity 0 and translateY(24px)', () => {
    const { container } = render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.style.transform).toBe('translateY(24px)');
  });

  it('becomes visible — opacity 1 and translateY(0px) — after intersection', () => {
    const { container } = render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    act(() => {
      capturedCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('1');
    expect(wrapper.style.transform).toBe('translateY(0px)');
  });

  it('applies the delay prop to the transition', () => {
    const { container } = render(
      <FadeIn delay={200}>
        <p>Hello</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transition).toContain('200ms');
  });

  it('uses 0ms delay by default', () => {
    const { container } = render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transition).toContain('0ms');
  });
});
