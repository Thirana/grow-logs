import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { useInView } from './use-in-view';

// renderHook leaves ref.current null (no DOM node to attach to), so the hook's
// `if (!el) return` guard exits before creating the observer. Render a real
// component so the ref is attached to an actual jsdom element.
function TestComponent() {
  const [ref, isInView] = useInView();
  return React.createElement(
    'div',
    { ref, 'data-testid': 'target' },
    isInView ? 'visible' : 'hidden',
  );
}

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

describe('useInView', () => {
  it('starts with isInView false', () => {
    render(React.createElement(TestComponent));
    expect(screen.getByText('hidden')).toBeInTheDocument();
  });

  it('sets isInView to true when the element intersects', () => {
    render(React.createElement(TestComponent));
    act(() => {
      capturedCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('does not change state when isIntersecting is false', () => {
    render(React.createElement(TestComponent));
    act(() => {
      capturedCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.getByText('hidden')).toBeInTheDocument();
  });

  it('disconnects the observer after the element enters view (fires once)', () => {
    render(React.createElement(TestComponent));
    act(() => {
      capturedCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(React.createElement(TestComponent));
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
