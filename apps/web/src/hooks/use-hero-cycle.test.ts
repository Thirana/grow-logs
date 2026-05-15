import { renderHook, act } from '@testing-library/react';
import { useFadeCycle, useTypewriter } from './use-hero-cycle';

const ITEMS = ['alpha', 'beta', 'gamma'] as const;
const DISPLAY_MS = 3000;
const FADE_MS = 300;

describe('useFadeCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first item and visible=true initially', () => {
    const { result } = renderHook(() => useFadeCycle(ITEMS, DISPLAY_MS, FADE_MS));
    expect(result.current.current).toBe('alpha');
    expect(result.current.visible).toBe(true);
  });

  it('sets visible to false after displayMs elapses', () => {
    const { result } = renderHook(() => useFadeCycle(ITEMS, DISPLAY_MS, FADE_MS));
    act(() => {
      vi.advanceTimersByTime(DISPLAY_MS);
    });
    expect(result.current.visible).toBe(false);
  });

  it('advances to the next item and restores visible after the fade window', () => {
    const { result } = renderHook(() => useFadeCycle(ITEMS, DISPLAY_MS, FADE_MS));
    act(() => {
      vi.advanceTimersByTime(DISPLAY_MS + FADE_MS);
    });
    expect(result.current.current).toBe('beta');
    expect(result.current.visible).toBe(true);
  });

  it('wraps around to the first item after the last one', () => {
    const { result } = renderHook(() => useFadeCycle(ITEMS, DISPLAY_MS, FADE_MS));
    act(() => {
      vi.advanceTimersByTime((DISPLAY_MS + FADE_MS) * ITEMS.length);
    });
    expect(result.current.current).toBe('alpha');
  });
});

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty string', () => {
    const { result } = renderHook(() => useTypewriter('hello', 100));
    expect(result.current).toBe('');
  });

  it('types one character per charDelayMs', () => {
    const { result } = renderHook(() => useTypewriter('hello', 100));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('h');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('he');
  });

  it('completes the full string after text.length * charDelayMs', () => {
    const { result } = renderHook(() => useTypewriter('hello', 100));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('hello');
  });

  it('resets and retypes when the text prop changes', () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, 100), {
      initialProps: { text: 'hello' },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('hello');

    rerender({ text: 'world' });
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('w');
  });
});
