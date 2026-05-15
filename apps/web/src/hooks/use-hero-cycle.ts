import { useState, useEffect, useRef } from 'react';

/**
 * Cycles through an array of items with a fade-out → swap → fade-in pattern.
 * `visible` is false during the fade-out window so callers can apply opacity-0.
 * `current` updates only after the fade-out completes so swapped content is never
 * visible while transitioning.
 */
export function useFadeCycle<T>(
  items: readonly T[],
  displayMs: number,
  fadeMs: number,
): { current: T; visible: boolean } {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, fadeMs);
    }, displayMs);

    return () => {
      clearInterval(interval);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [items.length, displayMs, fadeMs]);

  return { current: items[index], visible };
}

/**
 * Types out `text` character by character at `charDelayMs` per character.
 * Resets and restarts from the beginning whenever `text` changes.
 */
export function useTypewriter(text: string, charDelayMs = 16): string {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayed('');
    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, charDelayMs);

    return () => clearInterval(timer);
  }, [text, charDelayMs]);

  return displayed;
}
